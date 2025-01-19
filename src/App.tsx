import React, { useState, useCallback, useEffect } from 'react';
import { ArrowRightLeft, Star, StarOff, Receipt, Minus, Plus, Delete, RefreshCw } from 'lucide-react';
import { CurrencySelect } from './components/CurrencySelect';
import { getExchangeRate } from './services/api';
import type { ConversionResult } from './types/currency';
import { currencies } from './data/currencies';

function App() {
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('0');
  const [fromCurrency, setFromCurrency] = useState<string>(() => {
    return localStorage.getItem('favFromCurrency') || 'EUR';
  });
  const [toCurrency, setToCurrency] = useState<string>(() => {
    return localStorage.getItem('favToCurrency') || 'USD';
  });
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    return localStorage.getItem('isFavorite') === 'true';
  });
  const [numberOfPeople, setNumberOfPeople] = useState<number>(2);
  const [showSplitBill, setShowSplitBill] = useState<boolean>(false);

  const getSymbolForCurrency = (code: string) => {
    const currency = currencies.find(c => c.code === code);
    return currency ? currency.symbol : code;
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    return date.toLocaleString();
  };

  const handleCalculatorInput = (value: string) => {
    if (value === '=') {
      try {
        const calculatedResult = eval(input);
        setResult(calculatedResult.toString());
        setInput(calculatedResult.toString());
      } catch (error) {
        setResult('Error');
        setInput('');
      }
    } else if (value === 'C') {
      setInput('');
      setResult('0');
    } else if (value === 'backspace') {
      const newInput = input.slice(0, -1);
      setInput(newInput);
      if (newInput === '') {
        setResult('0');
      } else {
        try {
          const calculatedResult = eval(newInput);
          if (!isNaN(calculatedResult)) {
            setResult(calculatedResult.toString());
          }
        } catch (error) {
          // Ignore errors during input
        }
      }
    } else {
      const newInput = input + value;
      setInput(newInput);
      try {
        const calculatedResult = eval(newInput);
        if (!isNaN(calculatedResult)) {
          setResult(calculatedResult.toString());
        }
      } catch (error) {
        // Ignore errors during input
      }
    }
  };

  const handleConvert = useCallback(async (amount: number) => {
    if (isNaN(amount)) return;
    
    try {
      setLoading(true);
      const { rate, timestamp } = await getExchangeRate(fromCurrency, toCurrency);
      const calculatedResult = amount * rate;
      
      setConversionResult({
        amount: amount,
        from: fromCurrency,
        to: toCurrency,
        result: calculatedResult,
        rate: rate,
        lastUpdated: timestamp
      });
    } catch (error) {
      console.error('Conversion error:', error);
    } finally {
      setLoading(false);
    }
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const toggleFavorite = () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    if (newFavoriteState) {
      localStorage.setItem('favFromCurrency', fromCurrency);
      localStorage.setItem('favToCurrency', toCurrency);
      localStorage.setItem('isFavorite', 'true');
    } else {
      localStorage.removeItem('favFromCurrency');
      localStorage.removeItem('favToCurrency');
      localStorage.removeItem('isFavorite');
    }
  };

  const handlePeopleChange = (change: number) => {
    setNumberOfPeople(prev => Math.max(2, Math.min(10, prev + change)));
  };

  const getSplitAmount = () => {
    if (!conversionResult) return 0;
    return conversionResult.result / numberOfPeople;
  };

  const refreshRates = useCallback(() => {
    const amount = parseFloat(input || '1');
    handleConvert(amount);
  }, [input, handleConvert]);

  // Load initial rates
  useEffect(() => {
    handleConvert(1);
  }, [handleConvert]);

  // Update rates when currency changes or input changes
  useEffect(() => {
    const amount = parseFloat(input || '0');
    if (!isNaN(amount)) {
      handleConvert(amount);
    }
  }, [input, fromCurrency, toCurrency, handleConvert]);

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4">
      <div className="bg-[#151B2C] rounded-2xl shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">
              Currency Calculator
            </h1>
            <button
              onClick={toggleFavorite}
              className="p-1.5 rounded-full hover:bg-[#1F2943] transition-colors"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? (
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ) : (
                <StarOff className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshRates}
              className={`p-1.5 rounded-full hover:bg-[#1F2943] transition-colors ${loading ? 'animate-spin' : ''}`}
              disabled={loading}
              aria-label="Refresh rates"
            >
              <RefreshCw className="w-5 h-5 text-blue-400" />
            </button>
            <button
              onClick={() => setShowSplitBill(!showSplitBill)}
              className="p-1.5 rounded-full hover:bg-[#1F2943] transition-colors"
              aria-label="Split bill"
            >
              <Receipt className={`w-5 h-5 ${showSplitBill ? 'text-blue-400' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-start">
            <CurrencySelect
              value={fromCurrency}
              onChange={setFromCurrency}
              label="From"
            />
            
            <button
              onClick={handleSwap}
              className="p-1.5 rounded-full bg-[#1F2943] hover:bg-[#2A365C] transition-colors mt-7"
              aria-label="Swap currencies"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            </button>

            <CurrencySelect
              value={toCurrency}
              onChange={setToCurrency}
              label="To"
            />
          </div>

          <div className="grid grid-rows-[auto,auto] gap-2">
            <div className="relative">
              <input
                type="text"
                value={input}
                readOnly
                placeholder="0"
                className="w-full h-14 px-3 text-right border-none bg-[#1F2943] rounded-xl text-xl font-bold text-white focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                {getSymbolForCurrency(fromCurrency)}
              </div>
            </div>

            <div className="bg-[#1F2943] rounded-xl p-4 h-[5.5rem] flex flex-col justify-center">
              {conversionResult ? (
                <>
                  <p className="text-2xl font-bold text-white leading-tight">
                    {conversionResult.result.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {conversionResult.to}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400 leading-tight">
                      1 {conversionResult.from} = {conversionResult.rate.toFixed(4)} {conversionResult.to}
                    </p>
                    <p className="text-xs text-gray-500">
                      Updated {formatLastUpdated(conversionResult.lastUpdated)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-center">Enter an amount</p>
              )}
            </div>
          </div>

          {showSplitBill && (
            <div className="bg-[#1F2943] rounded-xl p-4 h-[4.5rem] flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-gray-300 text-sm">Per Person</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePeopleChange(-1)}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    disabled={numberOfPeople <= 2}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium text-white min-w-[1.5rem] text-center">{numberOfPeople}</span>
                  <button
                    onClick={() => handlePeopleChange(1)}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    disabled={numberOfPeople >= 10}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xl font-bold text-white mt-1">
                {conversionResult ? (
                  `${getSplitAmount().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ${conversionResult.to}`
                ) : (
                  '0.00'
                )}
              </p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5">
            {['7', '8', '9', '/'].map(btn => (
              <button
                key={btn}
                onClick={() => handleCalculatorInput(btn)}
                className={`h-10 rounded-lg transition-colors text-base font-medium ${
                  ['/', '*', '-', '+', '='].includes(btn)
                    ? 'bg-[#2A365C] hover:bg-[#354675] text-blue-400'
                    : 'bg-[#1F2943] hover:bg-[#2A365C] text-white'
                }`}
              >
                {btn}
              </button>
            ))}
            {['4', '5', '6', '*'].map(btn => (
              <button
                key={btn}
                onClick={() => handleCalculatorInput(btn)}
                className={`h-10 rounded-lg transition-colors text-base font-medium ${
                  ['/', '*', '-', '+', '='].includes(btn)
                    ? 'bg-[#2A365C] hover:bg-[#354675] text-blue-400'
                    : 'bg-[#1F2943] hover:bg-[#2A365C] text-white'
                }`}
              >
                {btn}
              </button>
            ))}
            {['1', '2', '3', '-'].map(btn => (
              <button
                key={btn}
                onClick={() => handleCalculatorInput(btn)}
                className={`h-10 rounded-lg transition-colors text-base font-medium ${
                  ['/', '*', '-', '+', '='].includes(btn)
                    ? 'bg-[#2A365C] hover:bg-[#354675] text-blue-400'
                    : 'bg-[#1F2943] hover:bg-[#2A365C] text-white'
                }`}
              >
                {btn}
              </button>
            ))}
            {['0', '.', '=', '+'].map(btn => (
              <button
                key={btn}
                onClick={() => handleCalculatorInput(btn)}
                className={`h-10 rounded-lg transition-colors text-base font-medium ${
                  ['/', '*', '-', '+', '='].includes(btn)
                    ? 'bg-[#2A365C] hover:bg-[#354675] text-blue-400'
                    : 'bg-[#1F2943] hover:bg-[#2A365C] text-white'
                }`}
              >
                {btn}
              </button>
            ))}
            <button
              onClick={() => handleCalculatorInput('backspace')}
              className="h-10 bg-[#2A365C] hover:bg-[#354675] rounded-lg transition-colors text-base font-medium text-blue-400 col-span-2"
              aria-label="Delete last digit"
            >
              <Delete className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => handleCalculatorInput('C')}
              className="h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors col-span-2 text-base font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
