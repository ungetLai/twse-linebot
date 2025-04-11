import { Client } from '@line/bot-sdk';
import axios from 'axios';
import { average, calcRSI, calcBollingerBands, getFlexMessage } from '../utils/indicators.js';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

// 中文股名對照（可擴充）
const stockNameMap = {
  '台積電': '2330',
  '星宇航空': '2646',
  '長榮航': '2618',
  '鴻海': '2317',
  '聯發科': '2454',
};

export const configModule = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const query = event.message.text.trim();
        let stockId = '';
        let stockName = query;

        if (/^\d{4}$/.test(query)) {
          stockId = query;
        } else if (stockNameMap[query]) {
          stockId = stockNameMap[query];
        } else {
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '請輸入正確的股票名稱或代碼（如：台積電 或 2330）',
          });
          return;
        }

        try {
          // 抓近兩個月資料
          const now = new Date();
          const ymList = [
            getYearMonthString(now),
            getYearMonthString(new Date(now.getFullYear(), now.getMonth() - 1, 1))
          ];

          const allData = [];

          for (const ym of ymList) {
            const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${ym}01&stockNo=${stockId}`;
            const res = await axios.get(url);
            if (res.data && res.data.data) {
              allData.push(...res.data.data);
            }
          }

          if (allData.length < 20) {
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: '目前資料筆數不足（可能是月初），無法分析技術指標，請過幾天再試～',
            });
            return;
          }

          const closes = allData
            .map(row => parseFloat(row[6].replace(/,/g, '')))
            .filter(v => !isNaN(v))
            .slice(-20);

          const ma5 = average(closes.slice(-5));
          const ma20 = average(closes);
          const rsi = calcRSI(closes);
          const { upper, lower } = calcBollingerBands(closes);
          const latestClose = closes[closes.length - 1];

          // 從 TWSE 標題中抓中文名稱
          const twseTitle = allData[0]?.[2] || ''; // fallback
          const displayName = `${query} (${stockId})`;

          const flex = getFlexMessage(latestClose, ma5, ma20, rsi, upper, lower, displayName);

          await client.replyMessage(event.replyToken, flex);
        } catch (err) {
          console.error('🚨 錯誤：', err);
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '資料擷取失敗，請稍後再試 🙏',
          });
        }
      }
    }

    res.status(200).end();
  } else {
    res.status(405).send('Method Not Allowed');
  }
}

// 工具：取得 yyyyMM 格式
function getYearMonthString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}${m}`;
}
