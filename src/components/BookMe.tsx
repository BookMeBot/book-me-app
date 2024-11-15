import Image from "next/image";
// import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

interface BookMeProps {
  chatId?: string;
}

const BookMe: React.FC<BookMeProps> = ({ chatId }) => {
  const { setShowAuthFlow, authToken, primaryWallet } = useDynamicContext();

  const handleShowAuthFlow = useCallback(() => {
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);

  console.log({ authToken, primaryWallet });

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
        onClick={handleShowAuthFlow}
      >
        connect
      </button>
    </div>
  );
};

export default BookMe;
