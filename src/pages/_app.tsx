import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export default function App({ Component, pageProps }: AppProps) {
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
