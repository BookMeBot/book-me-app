import "@/styles/globals.css";
import type { AppProps } from "next/app";
import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { useCallback } from "react";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export default function App({ Component, pageProps }: AppProps) {
  const onAuthSuccess = useCallback(async (args: any) => {
    try {
      // trigger sign message to send funds to agent wallet
    } catch (error) {
      console.error("Error during signIn", error);
    }
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
