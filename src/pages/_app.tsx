import "@/styles/globals.css";
import type { AppProps } from "next/app";
import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { useCallback, useEffect } from "react";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
import { initializeServer } from "../../lib/init";

let isInitialized = false;

export default function App({ Component, pageProps }: AppProps) {
  const onAuthSuccess = useCallback(async (args: any) => {
    try {
      // trigger sign message to send funds to agent wallet
    } catch (error) {
      console.error("Error during signIn", error);
    }
  }, []);

  const triggerCommand = async (
    chatId: string,
    command: string,
    params?: string
  ) => {
    const url = "http://localhost:3000/api/telegram/funded";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        command,
        params,
      }),
    });

    console.log({ response });

    return response.json();
  };

  useEffect(() => {
    const init = async () => {
      // await triggerCommand("-4555870136", "hello");
      if (!isInitialized) {
        try {
          await initializeServer();
          isInitialized = true;
        } catch (error) {
          console.error("Failed to initialize:", error);
        }
      }
    };

    init();
  }, []);

  return (
    <DynamicContextProvider
      settings={{
        environmentId: publicRuntimeConfig.dynamicEnvironmentId,
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <Component {...pageProps} />
    </DynamicContextProvider>
  );
}
