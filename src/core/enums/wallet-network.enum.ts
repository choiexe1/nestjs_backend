/**
 * 지원하는 지갑 네트워크 목록
 * 새로운 블록체인 네트워크는 여기에 추가
 */
export enum WalletNetwork {
  ETHEREUM = 'ethereum',
  BITCOIN = 'bitcoin',
  BSC = 'bsc',
}

/**
 * 네트워크별 설정 정보
 */
export const WALLET_NETWORK_CONFIG = {
  [WalletNetwork.ETHEREUM]: {
    name: 'Ethereum',
    symbol: 'ETH',
    explorerUrl: 'https://etherscan.io/address',
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
  [WalletNetwork.BITCOIN]: {
    name: 'Bitcoin',
    symbol: 'BTC',
    explorerUrl: 'https://blockstream.info/address',
    addressPattern: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
  },
  [WalletNetwork.BSC]: {
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    explorerUrl: 'https://bscscan.com/address',
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
} as const;

/**
 * 지원하는 모든 네트워크 목록을 배열로 반환
 */
export const getSupportedNetworks = (): string[] => {
  return Object.values(WalletNetwork);
};

/**
 * 네트워크가 지원되는지 확인
 */
export const isSupportedNetwork = (
  network: string,
): network is WalletNetwork => {
  return Object.values(WalletNetwork).includes(network as WalletNetwork);
};

/**
 * 지갑 주소가 특정 네트워크의 유효한 형식인지 검증
 * @param address 지갑 주소
 * @param network 네트워크
 * @returns 검증 결과
 */
export const validateWalletAddress = (
  address: string,
  network: WalletNetwork,
): { isValid: boolean; error?: string } => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: '지갑 주소는 필수입니다' };
  }

  const cleanAddress = address.trim();
  
  if (cleanAddress.length === 0) {
    return { isValid: false, error: '지갑 주소가 비어있습니다' };
  }

  const networkConfig = WALLET_NETWORK_CONFIG[network];
  if (!networkConfig) {
    return { 
      isValid: false, 
      error: `지원하지 않는 네트워크입니다: ${network}` 
    };
  }

  if (!networkConfig.addressPattern.test(cleanAddress)) {
    return {
      isValid: false,
      error: `${networkConfig.name} 네트워크의 주소 형식이 올바르지 않습니다`
    };
  }

  return { isValid: true };
};

/**
 * 네트워크 정보 조회
 * @param network 네트워크
 * @returns 네트워크 설정 정보 또는 null
 */
export const getNetworkConfig = (network: WalletNetwork) => {
  return WALLET_NETWORK_CONFIG[network] || null;
};
