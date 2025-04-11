import { Client } from '@line/bot-sdk';
import axios from 'axios';
import { average, calcRSI, calcBollingerBands, getFlexMessage } from '../utils/indicators.js';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

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
          // 👉 擷取即時資訊（抓中文名稱＋即時收盤價）
          const realtimeRes = await axios.get(`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${stockId}.tw&_=${Date.now()}`);
          const info = realtimeRes.data.msgArray?.[0];
          if (!info) throw new Error('無法取得即時資料');

          const displayName = `${info.n} (${stockId})`; // 中文名稱 (代碼)
          const close = parseFloat(info.z); // 最新成交價
          
          // 👉 抓最近兩個月日資料計算技術指標
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

          const closes = allData
            .map(row => parseFloat(row[6].replace(/,/g, '')))
            .filter(v => !isNaN(v))
            .slice(-20);

          if (closes.length < 20) {
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: '目前資料筆數不足（可能是月初），無法分析技術指標，請過幾天再試～',
            });
            return;
          }

          const ma5 = average(closes.slice(-5));
          const ma20 = average(closes);
          const rsi = calcRSI(closes);
          const { upper, lower } = calcBollingerBands(closes);

          const flex = getFlexMessage(close, ma5, ma20, rsi, upper, lower, displayName);
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

function getYearMonthString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}${m}`;
}
