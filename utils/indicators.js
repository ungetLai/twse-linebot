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
  
  // 判斷趨勢方向
  let trendDirection = '';
  let trendDescription = '';
  
  if (ma5 > ma20) {
    if (trendStrength > 3) {
      trendDirection = '強勢上漲';
      trendDescription = '多頭趨勢明確，上漲動能強勁';
    } else if (trendStrength > 1.5) {
      trendDirection = '上漲';
      trendDescription = '多頭趨勢，上漲動能穩定';
    } else {
      trendDirection = '緩步上漲';
      trendDescription = '多頭趨勢，但上漲動能較弱';
    }
  } else {
    if (trendStrength > 3) {
      trendDirection = '強勢下跌';
      trendDescription = '空頭趨勢明確，下跌壓力大';
    } else if (trendStrength > 1.5) {
      trendDirection = '下跌';
      trendDescription = '空頭趨勢，下跌壓力穩定';
    } else {
      trendDirection = '緩步下跌';
      trendDescription = '空頭趨勢，但下跌壓力較小';
    }
  }

  // 判斷趨勢持續性
  let trendPersistence = '';
  if (trendStrength > 2) {
    trendPersistence = '趨勢持續性高';
  } else if (trendStrength > 1) {
    trendPersistence = '趨勢持續性中等';
  } else {
    trendPersistence = '趨勢持續性低';
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
            text: '📊 趨勢分析',
            weight: 'bold',
            margin: 'md',
            size: 'md'
          },
          {
            type: 'text',
            text: `📌 趨勢方向：${trendDirection}\n📌 趨勢描述：${trendDescription}\n📌 趨勢強度：${trendStrength.toFixed(2)}%\n📌 趨勢持續性：${trendPersistence}`,
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
            text: `${getTradingAdvice(trendDirection, rsi, trendStrength)}`,
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

function getTradingAdvice(trendDirection, rsi, trendStrength) {
  let advice = '';
  
  // 根據趨勢方向提供建議
  if (trendDirection.includes('強勢上漲')) {
    advice += '多頭趨勢明確，可順勢做多，但需注意過熱風險。';
  } else if (trendDirection.includes('上漲')) {
    advice += '多頭趨勢，可分批布局，但需留意回檔風險。';
  } else if (trendDirection.includes('緩步上漲')) {
    advice += '多頭趨勢但動能較弱，建議謹慎操作，等待更明確訊號。';
  } else if (trendDirection.includes('強勢下跌')) {
    advice += '空頭趨勢明確，建議觀望或順勢做空，注意反彈風險。';
  } else if (trendDirection.includes('下跌')) {
    advice += '空頭趨勢，建議減碼或觀望，等待止跌訊號。';
  } else if (trendDirection.includes('緩步下跌')) {
    advice += '空頭趨勢但壓力較小，可留意反彈機會，但需謹慎。';
  }

  // 根據 RSI 提供建議
  if (rsi > 70) {
    advice += ' RSI 過熱，注意回檔風險。';
  } else if (rsi < 30) {
    advice += ' RSI 超賣，可留意反彈機會。';
  }

  // 根據趨勢強度提供建議
  if (trendStrength > 3) {
    advice += ' 趨勢強勁，可考慮加碼。';
  } else if (trendStrength < 1) {
    advice += ' 趨勢較弱，建議控制部位。';
  }

  return advice;
}
