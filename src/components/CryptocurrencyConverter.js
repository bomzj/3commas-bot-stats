import axios from 'axios'

const storeKey = 'cryptocurrency rates'

let quoteCoins = await fetchTopCryptocurrencies(30)
let rates = await getCryptocurrencyRatesFromCache()

export function convertToUSD(fromAmount, fromCryptoCode) {
  const coinGeckoId = cryptoCodeToCoinGeckoId(fromCryptoCode)
  return rates[coinGeckoId].usd * fromAmount
} 

export async function cacheCryptocurrencyRates() {

}

export async function getCryptocurrencyRatesFromCache() {
  return JSON.parse(localStorage.getItem(storeKey))
}

export async function updateCryptocurrencyRates() {
  let codes = quoteCoins.map(c => c.code)
  rates = await fetchCryptocurrencyRates(codes)
  localStorage.setItem(storeKey, JSON.stringify(rates))
}

export async function fetchCryptocurrencyRates(codes) {
  const ids = codes.map(cryptoCodeToCoinGeckoId).join()
  let response = await axios(`https://api.coingecko.com/api/v3/simple/price?` +
                             `ids=${ids}&` +
                             `vs_currencies=USD`)
  return response.data
}

async function fetchTopCryptocurrencies(topCount) {
  let response = await axios(`https://api.coingecko.com/api/v3/coins/markets?` +
                             `vs_currency=usd&order=market_cap_desc&page=1&per_page=${topCount}`)

  return response.data.map(c => ({ id: c.id, code: c.symbol }))
}

function cryptoCodeToCoinGeckoId(code) {
  const collator = new Intl.Collator(undefined, { sensitivity: 'base' })
  return quoteCoins.find(c => !collator.compare(c.code, code)).id
}