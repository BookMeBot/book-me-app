import Image from "next/image";
// import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { USDCTransfer } from "@/utils/usdc";

const USDC_CONTRACT_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const BookingTestData = {
  data: {
    chatId: "-4555870136",
    botWalletAddress: "0x35E38E69Ae9b11b675f2062b3D4E9FFB5ef756AC",
    nillionAppId: "exampleId",
    requestData: {
      location: "Chiang Mai",
      startDate: 0,
      endDate: 0,
      numberOfRooms: 2,
      features: ["Wi-Fi", "swimming pool"],
      budgetPerPerson: 0.1,
      currency: "USD",
    },
  },
};

interface BookMeProps {
  chatId?: string;
}

const switchToBaseSepolia = async () => {
  try {
    if (!window.ethereum) {
      console.log("no etheren window");
      return;
    }
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x14a34" }], // Base Sepolia chainId (84532)
    });
  } catch (switchError: any) {
    // If the network isn't added, add it
    if (switchError.code === 4902) {
      try {
        if (!window.ethereum) {
          console.log("no etheren window");
          return;
        }
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x14a34", // Updated to correct chainId
              chainName: "Base Sepolia",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://sepolia.base.org"],
              blockExplorerUrls: ["https://sepolia.basescan.org"],
            },
          ],
        });
      } catch (addError) {
        console.error("Error adding network:", addError);
      }
    }
  }
};

const BookMe: React.FC<BookMeProps> = ({ chatId }) => {
  const { setShowAuthFlow, authToken, primaryWallet, handleLogOut } =
    useDynamicContext();

  const [requestData, setRequestData] = useState<
    | undefined
    | {
        location: string;
        startDate: number;
        endDate: number;
        numberOfRooms: number;
        features: string[];
        budgetPerPerson: number;
        currency: string;
      }
  >();

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<
    "init" | "idle" | "loading" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState("");

  const fundWallet = useCallback(async () => {
    console.log("test fund");
    if (!primaryWallet?.address || !requestData?.budgetPerPerson) {
      console.log("missing data");
      return;
    }

    try {
      await switchToBaseSepolia();
      setStatus("loading");

      try {
        const usdcTransfer = new USDCTransfer();
        const result = await usdcTransfer.transfer(
          BookingTestData.data.botWalletAddress,
          requestData?.budgetPerPerson
        );

        setTxHash(result.hash);
        setStatus("success");
      } catch (error) {
        console.error("Transfer error:", error);
        setStatus("error");
      }
      console.log("Transaction confirmed");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  }, [primaryWallet?.address, requestData?.budgetPerPerson]);

  const handleButtonClick = useCallback(() => {
    const loggedIn = primaryWallet?.address;
    !loggedIn ? setShowAuthFlow(true) : fundWallet();
  }, [setShowAuthFlow]);

  console.log({ authToken, primaryWallet, status, requestData });

  const getChatData = useCallback(async () => {
    const url = `/api/redis?chatId=${chatId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log({ response });
    const data = await response.json();
    setRequestData(data.data?.requestData);
  }, [chatId]);

  useEffect(() => {
    if (chatId) getChatData();
  }, [chatId]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        // position: "relative",
      }}
    >
      {primaryWallet?.address && (
        <button
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            backgroundColor: "#FFF28B",
            color: "#FF4B6E",
            fontFamily: "sans-serif",
            fontSize: "16px",
            padding: "6px 24px",
            border: "none",
            borderRadius: "50px",
            cursor: "pointer",
            transform: "translateY(-4px)",
            transition: "all 0.2s",
          }}
          onClick={() => {
            setStatus("init");
            handleLogOut();
          }}
        >
          disconnect
        </button>
      )}
      <Image src="BookMe.svg" alt="Book Me Logo" width={600} height={600} />

      {status === "success" ? (
        <>
          <p style={{ color: "#000", fontWeight: "bold" }}>
            Funding confirmed ✅
          </p>
          <p style={{ color: "#000", fontSize: "14px" }}>
            Once all members have funded, the bot will automatically send you
            hotel options to book
          </p>
        </>
      ) : (
        <>
          <p style={{ color: "#000" }}>
            {!requestData
              ? ``
              : `Fund "${
                  requestData?.location
                }" travel with your share of $${requestData?.budgetPerPerson?.toFixed(
                  2
                )}`}
          </p>
          <button
            style={{
              backgroundColor: "#FFF28B",
              color: "#FF4B6E",
              fontFamily: "sans-serif",
              fontSize: "18px",
              textTransform: "lowercase",
              padding: "8px 48px",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              position: "relative",
              transform: "translateY(-4px)",
              boxShadow: "0 4px 0 #FF4B6E",
              transition: "all 0.2s",
              marginTop: "20px",
            }}
            onClick={() => handleButtonClick()}
          >
            {`${primaryWallet?.address ? "fund" : "connect"}`}
          </button>
        </>
      )}
    </div>
  );
};

export default BookMe;
