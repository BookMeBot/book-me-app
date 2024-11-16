import Image from "next/image";
// import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

const BookingTestData = {
  data: {
    chatId: "-4555870136",
    botWalletAddress: "0xe8E5e7BFB725Ef08B0495299fBD2CE4e296C6f3d",
    nillionAppId: "exampleId",
    bookingData: {
      location: "Chiang Mai",
      startDate: 0,
      endDate: 0,
      numberOfRooms: 2,
      features: ["Wi-Fi", "swimming pool"],
      budgetPerPerson: 200,
      currency: "USD",
    },
  },
};

interface BookMeProps {
  chatId?: string;
}

const BookMe: React.FC<BookMeProps> = ({ chatId }) => {
  const { setShowAuthFlow, authToken, primaryWallet } = useDynamicContext();

  const handleShowAuthFlow = useCallback(() => {
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);

  console.log({ authToken, primaryWallet });

  const getChatData = useCallback(() => {
    //fetch data from backend bot
  }, [chatId]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center", // This will center the text within elements
      }}
    >
      <Image src="BookMe.svg" alt="Book Me Logo" width={600} height={600} />
      <p style={{ color: "#000" }}>
        Fund "Chang Mai Trip" travel with your share of $300
      </p>
      {/* <DynamicWidget /> */}
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
        onClick={() => setShowAuthFlow(true)}
      >
        connect
      </button>
    </div>
  );
};

export default BookMe;
