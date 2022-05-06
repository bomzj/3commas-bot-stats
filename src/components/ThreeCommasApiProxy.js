import ThreeCommasAPI from './ThreeCommasApi'

export default function useThreeCommasApiProxy() {
  let apiKey = "f56d6fc78bce470395f266edce60b8eeee549b927456481f84d81dfcdd6e24a4"
  let apiSecret = "51ec2f23fe7c257db536a76c3d619ed0c4b69fe923bdb817b43966ceee52fde12d06a0461c2837914ba61a464eb31fed3e4f9182b3fe3f865d55d23889f5851dfb7cfbd46a162fe13ce117c30ab3f4137adb9cd359d10fd6bf65378d61cd1eb3388b5206"
  let proxyPath = '/.netlify/functions/cors-proxy/https://api.3commas.io'

  let api = new ThreeCommasAPI({
      url: proxyPath,
      apiKey: apiKey,
      apiSecret: apiSecret,
      forcedMode: 'paper'
  })

  return api
}