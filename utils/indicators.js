// 工具模組：技術指標計算

export function average(arr) {
  return (arr.reduce((sum, val) => sum + val, 0) / arr.length).toFixed(2);
}

export function calcRSI(closes) {
  let gains = 0, losses = 0;
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1);
  return Math.min(100, Math.max(0, (100 - 100 / (1 + rs)))).toFixed(2);
}

export function calcBollingerBands(closes) {
  const mean = parseFloat(average(closes));
  const variance = closes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / closes.length;
  const stddev = Math.sqrt(variance);
  return {
    upper: (mean + 2 * stddev).toFixed(2),
    lower: (mean - 2 * stddev).toFixed(2),
  };
}

export function getFlexMessage(close, ma5, ma20, rsi, upper, lower, displayName) {
  // 計算趨勢強度
  const trendStrength = Math.abs(ma5 - ma20) / ma20 * 100;
  
  // 判斷趨勢
  let trend = '';
  if (ma5 > ma20) {
    trend = trendStrength > 2 ? '強勢上漲' : '緩步上漲';
  } else {
    trend = trendStrength > 2 ? '強勢下跌' : '緩步下跌';
  }

  // 判斷震盪程度
  const volatility = ((upper - lower) / ma20 * 100).toFixed(2);
  let volatilityLevel = '';
  if (volatility > 5) {
    volatilityLevel = '高波動';
  } else if (volatility > 3) {
    volatilityLevel = '中波動';
  } else {
    volatilityLevel = '低波動';
  }

  // 判斷盤整狀態
  let consolidation = '';
  if (Math.abs(ma5 - ma20) / ma20 < 0.01 && volatility < 3) {
    consolidation = '盤整格局';
  } else if (Math.abs(ma5 - ma20) / ma20 < 0.02 && volatility < 4) {
    consolidation = '區間整理';
  } else {
    consolidation = '趨勢行情';
  }

  return {
    type: 'flex',
    altText: `${displayName} 技術分析報告`,
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: `📈 ${displayName}`,
            weight: 'bold',
            size: 'xl'
          },
          {
            type: 'text',
            text: `最新價格：${close} 元`,
            size: 'sm',
            color: '#888888'
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '▶ 技術指標',
                weight: 'bold',
                size: 'md'
              },
              {
                type: 'text',
                text: `MA5：${ma5}｜MA20：${ma20}`,
                size: 'sm'
              },
              {
                type: 'text',
                text: `RSI14：${rsi}`,
                size: 'sm'
              },
              {
                type: 'text',
                text: `布林通道：上軌 ${upper}｜下軌 ${lower}`,
                size: 'sm'
              }
            ]
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: '📊 解讀與建議',
            weight: 'bold',
            margin: 'md',
            size: 'md'
          },
          {
            type: 'text',
            text: `📌 MA5 ${ma5 > ma20 ? '高於' : '低於'} MA20，${ma5 > ma20 ? '短線趨勢偏多' : '短線轉弱'}。\n📌 RSI14 為 ${rsi}，${rsi > 70 ? '已進入超買區' : rsi < 30 ? '進入超賣區' : '尚屬中性'}。\n📌 收盤價接近 ${close >= upper ? '布林上軌' : close <= lower ? '布林下軌' : '布林中軌附近'}。\n\n🔍 建議：${rsi > 70 ? '短線漲多，可考慮觀望或逢高減碼。' : rsi < 30 ? '超賣區，可留意反彈契機。' : '維持觀望，待突破方向明朗。'}`,
            size: 'sm',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'text',
            text: `📌 趨勢判斷：${trend}\n📌 波動程度：${volatilityLevel} (${volatility}%)\n📌 行情型態：${consolidation}`,
            size: 'sm',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: '💡 操作建議',
            weight: 'bold',
            margin: 'md',
            size: 'md'
          },
          {
            type: 'text',
            text: `${getTradingAdvice(trend, rsi, volatility, consolidation)}`,
            size: 'sm',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'text',
            text: `警語說明： 僅供參考，投資人應獨立判斷。 \n審慎投資，自負風險 `,
            weight: 'bold',
            wrap: true,
            margin: 'md',
            size: 'md'
          }
        ]
      }
    }
  };
}

function getTradingAdvice(trend, rsi, volatility, consolidation) {
  let advice = '';
  
  // 根據趨勢提供建議
  if (trend.includes('強勢')) {
    advice += '趨勢明確，可順勢操作。';
  } else if (trend.includes('緩步')) {
    advice += '趨勢溫和，建議分批布局。';
  }

  // 根據 RSI 提供建議
  if (rsi > 70) {
    advice += ' RSI 過熱，注意回檔風險。';
  } else if (rsi < 30) {
    advice += ' RSI 超賣，可留意反彈機會。';
  }

  // 根據波動程度提供建議
  if (volatility > 5) {
    advice += ' 波動較大，建議控制部位。';
  }

  // 根據盤整狀態提供建議
  if (consolidation.includes('盤整')) {
    advice += ' 盤整格局，可採區間操作。';
  } else if (consolidation.includes('整理')) {
    advice += ' 區間整理，建議觀望等待突破。';
  }

  return advice;
}
