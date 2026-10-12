import React, { createContext, useContext, useEffect, useState } from 'react';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToStudionet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  chainId: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchToStudionet: async () => {},
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(() => {
    return localStorage.getItem('gc_wallet_address');
  });
  const [chainId, setChainId] = useState<number | null>(null);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[];
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          localStorage.setItem('gc_wallet_address', accounts[0]);
        }
        const currentChainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
        setChainId(parseInt(currentChainId, 16));
      } catch (err) {
        console.error('Failed to check wallet connection:', err);
      }
    }
  };

  useEffect(() => {
    checkConnection();

    if (window.ethereum?.on) {
      const handleAccountsChanged = (accounts: unknown) => {
        const accs = accounts as string[];
        if (accs.length === 0) {
          setAddress(null);
          localStorage.removeItem('gc_wallet_address');
        } else {
          setAddress(accs[0]);
          localStorage.setItem('gc_wallet_address', accs[0]);
        }
      };

      const handleChainChanged = (chain: unknown) => {
        setChainId(parseInt(chain as string, 16));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({
          method: 'eth_requestAccounts',
        })) as string[];
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          localStorage.setItem('gc_wallet_address', accounts[0]);
        }
        const currentChain = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
        setChainId(parseInt(currentChain, 16));
      } catch (err) {
        console.error('User rejected wallet connection:', err);
      }
    } else {
      alert('No Web3 wallet detected. Please install MetaMask or a compatible browser wallet.');
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    localStorage.removeItem('gc_wallet_address');
  };

  const switchToStudionet = async () => {
    if (!window.ethereum) return;
    const studionetHex = '0xF22F'; // 61999
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: studionetHex }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: studionetHex,
                chainName: 'GenLayer Studionet',
                rpcUrls: ['https://studio.genlayer.com/api'],
                nativeCurrency: {
                  name: 'GEN',
                  symbol: 'GEN',
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Studionet chain:', addError);
        }
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnected: !!address,
        connectWallet,
        disconnectWallet,
        switchToStudionet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
