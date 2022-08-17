// interface NavigatorUAData {
//   brands: Array<{brand: string; version: string}>;
//   mobile: boolean;
//   platform: string;
// }

export function getUAString() {
  const uaData = navigator.userAgentData;

  if (uaData?.brands) {
    return uaData.brands
      .map((item) => `${item.brand}/${item.version}`)
      .join(' ');
  }

  return navigator.userAgent;
}
