'use client';
import SimpleStorage from "@/components/shared/SimpleStorage";
import NotConnected from "@/components/shared/NotConnected";
import { useAccount } from "wagmi";

export default function Home() {

  const { isConnected } = useAccount();
  return (
    <>
      {isConnected ? (
        <SimpleStorage />
      ) : (
        <NotConnected />
      )}
    </>
  );
}
