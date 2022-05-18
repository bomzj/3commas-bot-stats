export function formatCurrency(value, currency, hideFractionDigits) {
  try {
    let formatter = new Intl.NumberFormat(undefined, 
      { 
        style: 'currency', 
        currency,
        minimumFractionDigits: hideFractionDigits ? 0 : undefined,
        maximumFractionDigits: hideFractionDigits ? 0 : undefined,
        notation: value > 1000000 ? 'compact' : 'standard',
        maximumSignificantDigits: value > 1000000 ? 3 : undefined
      })
    
    return formatter.format(value);
  } catch (error) {
    console.log('Error occured while currency code is ' + currency)
  }
}