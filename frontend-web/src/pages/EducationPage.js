import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEducationProgress, setEducationProgress } from '../services/educationService';
import { useLocation, useNavigate } from 'react-router-dom';

// Curriculum data: two modules, each with lessons and quizzes
const curriculumData = {
  stocks: {
    title: 'Stock Market',
    modules: [
      {
        id: 1,
        title: 'Foundations',
        intro: "This initial module establishes the core vocabulary and conceptual landscape of the financial world. A firm grasp of these foundational ideas is non-negotiable, as all subsequent practical knowledge is built upon them. This section will introduce you to what markets are, the assets traded within them, and the key players that make it all work.",
        lessons: [
          {
            title: 'What Is a Market?',
            content: `At its most fundamental level, a market is any place that facilitates the buying and selling of assets. The stock market, also known as the equity market, is where buyers and sellers trade stocks—securities representing ownership claims on public businesses. It's a complex network of exchanges and participants operating under rules to ensure fairness and order.`,
            quiz: {
              question: 'What is the primary function of a market?',
              options: ['To set government policy', 'To facilitate buying and selling of assets', 'To offer loans only', 'To issue currency'],
              answer: 1
            }
          },
          {
            title: 'Financial Assets: Stocks vs. Bonds',
            content: `A financial asset is an intangible asset whose value comes from a contractual claim. The two most important types are: <br><br> <b>Stocks (Equity):</b> Represent fractional ownership in a company. Investors make money through capital appreciation (selling for a higher price) and sometimes dividends. It's about owning a piece of the business.<br><br><b>Bonds (Debt):</b> Essentially a loan to a corporation or government. The investor receives periodic interest payments and the original loan amount (principal) back at maturity. It's about loaning money for a fixed return.`,
            quiz: {
              question: 'If you buy a bond, what are you doing?',
              options: ['Buying ownership in a company', 'Loaning money to an entity', 'Speculating on short-term price moves', 'Owning a piece of a commodity'],
              answer: 1
            }
          },
          {
            title: 'The Stock Market Ecosystem',
            content: `The stock market is a network of exchanges where securities are traded. Key players include:<ul><li class="mt-2"><b>Exchanges:</b> Central marketplaces like the NYSE (New York Stock Exchange) and NASDAQ. They provide infrastructure for trading and price discovery.</li><li class="mt-2"><b>Brokers:</b> Financial firms that act as intermediaries, executing buy and sell orders for individual investors. Modern online brokers provide direct platform access.</li></ul>`,
            quiz: {
              question: 'What is the role of a stock broker?',
              options: ['To set the price of stocks', 'To regulate the entire market', 'To act as an intermediary for traders', 'To create new companies'],
              answer: 2
            }
          },
          {
            title: 'How Stock Prices Are Determined',
            content: `A stock's price is determined by supply and demand. If more people want to buy (demand) than sell (supply), the price goes up, and vice versa. This process is governed by <b>liquidity</b>—the ease with which a stock can be bought or sold without affecting its price. High liquidity leads to a tight <b>bid-ask spread</b> (the difference between the highest buy price and lowest sell price), reducing transaction costs.`,
            quiz: {
              question: 'A stock price will likely increase when:',
              options: ['Supply exceeds demand', 'Demand exceeds supply', 'Supply and demand are equal', 'The bid-ask spread is wide'],
              answer: 1
            }
          },
          {
            title: 'Reading Stock Tickers and Quotes',
            content: `A stock ticker reports price and transaction data. Key elements include:<ul><li><b>Ticker Symbol:</b> A unique 1-4 letter code (e.g., AAPL for Apple).</li><li><b>Volume:</b> Number of shares traded.</li><li><b>Price:</b> The last price at which a trade was executed.</li><li><b>Change:</b> The price difference from the previous day's close, often color-coded (Green for up, Red for down).</li></ul>`,
            quiz: {
              question: 'What does the "Volume" on a stock quote represent?',
              options: ["The company's total number of employees", "The number of shares traded", "The stock's highest price of the day", "The dividend paid per share"],
              answer: 1
            }
          }
        ]
      },
      {
        id: 2,
        title: 'Your Trading Toolkit',
        intro: "This module transitions from theory to practice, guiding you through the essential steps before placing a trade. We'll cover choosing a trading style, selecting the right tools, and establishing a safe environment for learning and execution.",
        lessons: [
            {
                title: 'Defining Your Trader Identity',
                content: `Choosing a style that fits your personality and lifestyle is crucial. There are three primary styles:<ul class="list-disc list-inside mt-2 space-y-1"><li><b>Day Trading:</b> Opening and closing positions within a single day. High time commitment and risk.</li><li><b>Swing Trading:</b> Holding positions for a few days to several weeks to capture a "swing" in price. Moderate time commitment.</li><li><b>Position Trading:</b> Holding positions for months or years, focusing on long-term trends. Low active time commitment.</li></ul>`,
                quiz: {
                    question: 'A trader who holds positions for several weeks is most likely a:',
                    options: ['Day Trader', 'Swing Trader', 'Position Trader', 'Scalper'],
                    answer: 1
                }
            },
            {
                title: 'Choosing the Right Brokerage Account',
                content: `Your broker is your gateway to the markets. Key factors when choosing:<ul><li><b>Fees:</b> Look beyond commission-free trades for other costs like inactivity or data fees.</li><li><b>Platform & Tools:</b> A high-quality platform with good charting and research tools is essential.</li><li><b>Account Types:</b> A <b>cash account</b> requires you to pay in full. A <b>margin account</b> allows you to borrow from the broker, which increases leverage and risk.</li></ul>For passive investors, <b>robo-advisors</b> can automate portfolio management.`,
                quiz: {
                    question: 'What is a primary risk of a margin account?',
                    options: ['No fees', 'Increased leverage and risk', 'Slow trade execution', 'Limited stock selection'],
                    answer: 1
                }
            },
            {
                title: 'Funding Your Account and Understanding Fees',
                content: `Before funding an account, ensure your personal finances are in order: have an emergency fund and pay off high-interest debt. Trade only with risk capital—money you can afford to lose. While many brokers offer zero commissions, be aware of other potential fees.`,
                quiz: {
                    question: 'What is "risk capital" in the context of trading?',
                    options: ['Money borrowed from the broker', 'Your entire life savings', 'Money you can afford to lose', 'Money for paying fees only'],
                    answer: 2
                }
            },
            {
                title: 'Introduction to Trading Platforms',
                content: `A trading platform is your command center. Key features include:<ul><li><b>Watchlists:</b> Customizable lists to monitor securities.</li><li><b>Charting Tools:</b> For visualizing price history and applying technical indicators.</li><li><b>Order Entry:</b> The interface for placing trades.</li><li><b>Account Info:</b> Displays your balance, positions, and order history.</li></ul>`,
                quiz: {
                    question: 'What is a "watchlist" used for on a trading platform?',
                    options: ['To execute trades immediately', 'To monitor a specific list of securities', 'To chat with other traders', 'To view your account balance'],
                    answer: 1
                }
            },
            {
                title: 'The Importance of Paper Trading',
                content: `Paper trading (simulated trading) is an indispensable, risk-free tool. It allows you to:<ul><li>Learn the trading platform.</li><li>Practice placing order types.</li><li>Test and develop a strategy.</li><li>Experience market emotions without financial consequences.</li></ul>Skipping this step is a common and costly mistake for new traders.`,
                quiz: {
                    question: 'What is the main benefit of paper trading?',
                    options: ['It guarantees future profits', 'It involves trading with real money', 'It is a risk-free way to practice', 'It provides certified financial advice'],
                    answer: 2
                }
            }
        ]
      },
      {
        id: 3,
        title: 'Trade Execution & Management',
        intro: "This module covers the most critical, action-oriented skills: how to execute trades with precision and, most importantly, how to manage risk. Mastering these mechanics is what determines a trader's longevity in the market.",
        lessons: [
            {
                title: 'An Overview of Order Types',
                content: `The type of order you use has significant implications for your trade. A <b>market order</b> executes immediately at the current price, while a <b>limit order</b> executes only at a specific price or better. A <b>stop-loss order</b> is a defensive order to exit a trade if the price moves against you to a certain point.`,
                quiz: {
                    question: 'Which order type guarantees a specific price but not execution?',
                    options: ['Market Order', 'Limit Order', 'Stop-Loss Order', 'Fill-or-Kill Order'],
                    answer: 1
                }
            },
            {
                title: 'Essential Risk Management I: The 1% Rule',
                content: `Risk management is the key to survival. The <b>One-Percent Rule</b> is a guideline stating you should never risk more than 1% of your total trading capital on a single trade. This ensures that a string of losses will not be catastrophic. The practical tool to enforce this is the <b>stop-loss order</b>, a pre-set price to exit a trade and cap your losses.`,
                quiz: {
                    question: 'What does the 1% Rule suggest?',
                    options: ['Aim for a 1% profit on every trade', 'Invest in only 1% of available stocks', 'Never risk more than 1% of your capital on one trade', 'Pay 1% in commission fees'],
                    answer: 2
                }
            },
            {
                title: 'Essential Risk Management II: Position Sizing',
                content: `Position sizing determines how many shares to trade based on your account size and risk parameters. It connects the 1% rule to a concrete action. The formula is typically: (Account Size * Risk %) / (Entry Price - Stop-Loss Price).`,
                quiz: {
                    question: 'Position sizing helps a trader determine what?',
                    options: ['Which stock to buy', 'How many shares to trade', 'When to enter the market', 'The future price of a stock'],
                    answer: 1
                }
            },
            {
                title: 'Planning Your Trades: Risk/Reward Ratio',
                content: `Every trade should be planned before capital is at risk. Define three points: Entry, Stop-Loss, and Take-Profit. This allows you to calculate the <b>Risk/Reward Ratio</b>. For example, buying at $50 with a stop at $48 (a $2 risk) and a target at $56 (a $6 reward) gives a 3:1 ratio. Seeking trades with a ratio of 2:1 or higher ensures your winners are significantly larger than your losers.`,
                quiz: {
                    question: 'A trade with a $5 risk and a potential $15 reward has what Risk/Reward Ratio?',
                    options: ['1:2', '1:3', '3:1', '5:1'],
                    answer: 1
                }
            }
        ]
      },
      {
        id: 4,
        title: 'Fundamental Analysis (FA)',
        intro: "This module shifts focus to the long-term drivers of value. Fundamental analysis involves analyzing a company's underlying financial health and intrinsic worth to make informed investment decisions, treating a stock as a piece of a business, not just a ticker symbol.",
        lessons: [
            {
                title: 'Introduction to Fundamental Analysis',
                content: `FA is a method of evaluating a security to determine its <b>intrinsic value</b>. If the intrinsic value is higher than the current market price, the stock may be undervalued. This approach analyzes financial statements, management effectiveness, competitive position, and macroeconomic factors.`,
                quiz: {
                    question: 'What is the primary goal of Fundamental Analysis?',
                    options: ['To predict short-term price charts', 'To determine a security\'s intrinsic value', 'To follow market trends', 'To analyze trading volume'],
                    answer: 1
                }
            },
            {
                title: 'Decoding Annual Reports: 10-K & 10-Q',
                content: `The primary source documents for FA are SEC filings:<ul><li><b>Form 10-K:</b> A comprehensive annual report (audited).</li><li><b>Form 10-Q:</b> A quarterly report (unaudited).</li></ul> Key sections to read include Risk Factors, Management's Discussion and Analysis (MD&A), and the financial statements.`,
                quiz: {
                    question: 'Which SEC filing provides a comprehensive ANNUAL overview of a company?',
                    options: ['Form 10-Q', 'Form 8-K', 'Form 10-K', 'Form S-1'],
                    answer: 2
                }
            },
            {
                title: 'The Three Core Financial Statements',
                content: `These statements provide a complete picture of a company's health:<ul><li><b>Balance Sheet:</b> A snapshot of assets, liabilities, and equity ($Assets = Liabilities + Equity$).</li><li><b>Income Statement:</b> Shows performance over time, detailing revenues, expenses, and net income (profit).</li><li><b>Statement of Cash Flows:</b> Tracks the movement of cash from operating, investing, and financing activities. A company with high profits but negative cash flow from operations is a red flag.</li></ul>`,
                quiz: {
                    question: 'Which financial statement shows a company\'s financial position at a single point in time?',
                    options: ['Income Statement', 'Statement of Cash Flows', 'Balance Sheet', 'Annual Report'],
                    answer: 2
                }
            },
            {
                title: 'Earnings Reports and EPS',
                content: `Earnings (profits) are a key driver of stock prices. <b>Earnings Per Share (EPS)</b> is a standard metric ($Net Income / Shares Outstanding$). Companies report earnings quarterly, and the market reacts based on whether the results beat or miss analyst expectations.`,
                quiz: {
                    question: 'What does EPS stand for?',
                    options: ['Equity Per Share', 'Earnings Per Share', 'Estimated Profit System', 'Essential Price Standard'],
                    answer: 1
                }
            },
            {
                title: 'Key Valuation Metrics',
                content: `Two common metrics to compare companies:<ul><li><b>Price-to-Earnings (P/E) Ratio:</b> ($Stock Price / EPS$). It shows how much investors are willing to pay per dollar of earnings. It's most useful for comparing a company to its competitors or its own history.</li><li><b>Market Capitalization:</b> ($Share Price * Shares Outstanding$). It measures a company's size (Large-Cap, Mid-Cap, Small-Cap).</li></ul>`,
                quiz: {
                    question: 'What does a high P/E ratio generally suggest?',
                    options: ['The stock is undervalued', 'The company is not profitable', 'Investors expect high future growth', 'The company has a lot of debt'],
                    answer: 2
                }
            },
            {
                title: 'Qualitative vs. Quantitative Analysis',
                content: `A complete analysis includes qualitative factors not easily measured by numbers:<ul><li>Management effectiveness</li><li>Brand recognition</li><li>Competitive advantage (economic moat)</li><li>Industry trends</li></ul>`,
                quiz: {
                    question: 'Which of the following is a qualitative factor?',
                    options: ['Revenue', 'P/E Ratio', 'Brand Recognition', 'Net Income'],
                    answer: 2
                }
            }
        ]
      },
      {
        id: 5,
        title: 'Technical Analysis (TA)',
        intro: "This module introduces the second major school of market analysis. Technical analysis focuses on the study of price action and volume to forecast future price movements based on historical patterns and trends. It is the language of the market charts.",
        lessons: [
            {
                title: 'Introduction to Technical Analysis',
                content: `TA assumes that all known information is already reflected in the price, prices move in trends, and history tends to repeat itself. While FA asks "What is this company worth?", TA asks "Where is the price likely to go next?".`,
                quiz: {
                    question: 'A core assumption of Technical Analysis is that:',
                    options: ['Prices move randomly', 'Company earnings are irrelevant', 'History tends to repeat itself', 'The market is always efficient'],
                    answer: 2
                }
            },
            {
                title: 'The Three Types of Charts',
                content: `The price chart is the technician's primary tool. Common types include <b>Line charts</b> (simple), <b>Bar charts</b> (show open, high, low, close), and <b>Candlestick charts</b> (similar to bar charts but more visual).`,
                quiz: {
                    question: 'Which chart type provides the most information (Open, High, Low, Close)?',
                    options: ['Line Chart', 'Pie Chart', 'Area Chart', 'Candlestick Chart'],
                    answer: 3
                }
            },
            {
                title: 'Identifying Trends and Trendlines',
                content: `A trend is the general direction of the market.<ul><li><b>Uptrend:</b> A series of higher highs and higher lows.</li><li><b>Downtrend:</b> A series of lower highs and lower lows.</li></ul> A <b>trendline</b> is a line drawn on a chart to visualize the trend and act as dynamic support or resistance.`,
                quiz: {
                    question: 'An uptrend is characterized by:',
                    options: ['Lower highs and lower lows', 'Higher highs and higher lows', 'No clear direction', 'Constant prices'],
                    answer: 1
                }
            },
            {
                title: 'Support and Resistance',
                content: `These are key price levels where supply and demand meet.<ul><li><b>Support:</b> A price level where a downtrend tends to pause or reverse. Acts as a price floor.</li><li><b>Resistance:</b> A price level where an uptrend tends to pause or reverse. Acts as a price ceiling.</li></ul> When a resistance level is broken, it often becomes new support, and vice versa.`,
                quiz: {
                    question: 'A price level that acts as a "ceiling" is known as:',
                    options: ['Support', 'Resistance', 'Trendline', 'Volume'],
                    answer: 1
                }
            },
            {
                title: 'The Role of Volume',
                content: `Volume measures the number of shares traded and confirms the strength of a price move. A breakout above resistance on high volume is more significant than one on low volume. Rising prices on falling volume can be a warning sign that a trend is losing momentum.`,
                quiz: {
                    question: 'High trading volume during a price breakout typically suggests:',
                    options: ['Weakness in the move', 'Strength in the move', 'An imminent reversal', 'Low liquidity'],
                    answer: 1
                }
            },
            {
                title: 'Introduction to Technical Indicators',
                content: `Indicators are mathematical calculations based on price/volume. Examples include <b>Moving Averages</b> (show trend), <b>RSI</b> (shows momentum and overbought/oversold conditions), and <b>MACD</b> (shows trend and momentum).`,
                quiz: {
                    question: 'Which indicator is primarily used to identify overbought or oversold conditions?',
                    options: ['Moving Average', 'Volume', 'RSI (Relative Strength Index)', 'Trendline'],
                    answer: 2
                }
            },
            {
                title: 'Common Chart Patterns',
                content: `Patterns are recurring formations that can have predictive value. They represent the psychological battle between buyers and sellers. Examples include:<ul><li><b>Reversal Patterns:</b> Head and Shoulders, Double Tops/Bottoms.</li><li><b>Continuation Patterns:</b> Flags, Pennants, Cup and Handle.</li><li><b>Neutral Patterns:</b> Triangles.</li></ul>`,
                quiz: {
                    question: 'The "Head and Shoulders" is an example of what kind of chart pattern?',
                    options: ['Continuation Pattern', 'Reversal Pattern', 'Neutral Pattern', 'Volume Pattern'],
                    answer: 1
                }
            }
        ]
      },
      {
        id: 6,
        title: 'Advanced Instruments',
        intro: "This module introduces more complex instruments beyond simple stocks. These tools offer greater flexibility and sophisticated strategies but come with significantly increased risk. A mastery of all preceding modules is a prerequisite.",
        lessons: [
            {
                title: 'Beyond Stocks: ETFs and Mutual Funds',
                content: `These are pooled investment vehicles that offer instant diversification.<ul><li><b>ETFs (Exchange-Traded Funds):</b> Trade like stocks throughout the day. Mostly passively managed to track an index. Generally lower fees and more tax-efficient.</li><li><b>Mutual Funds:</b> Trade only once per day. Often actively managed to beat an index, which results in higher fees.</li></ul>`,
                quiz: {
                    question: 'A key difference between ETFs and Mutual Funds is that ETFs:',
                    options: ['Are always actively managed', 'Trade like stocks throughout the day', 'Are only available to institutional investors', 'Have no management fees'],
                    answer: 1
                }
            },
            {
                title: 'Introduction to Options Trading',
                content: `An option is a contract giving the buyer the <b>right, but not the obligation</b>, to buy or sell an asset at a set price before a set date. The buyer pays a <b>premium</b> for this right.<ul><li><b>Call Option:</b> The right to BUY. Used when you're bullish.</li><li><b>Put Option:</b> The right to SELL. Used when you're bearish.</li></ul>`,
                quiz: {
                    question: 'A "Call Option" gives you the right to:',
                    options: ['Sell an asset at a set price', 'Buy an asset at a set price', 'Short-sell a stock', 'Receive a dividend'],
                    answer: 1
                }
            },
            {
                title: 'Introduction to Short Selling',
                content: `Short selling is a strategy to profit from a price decline. It involves: <ol class="list-decimal list-inside"><li>Borrowing shares from a broker.</li><li>Selling the borrowed shares.</li><li>Buying the shares back later (hopefully at a lower price).</li><li>Returning the shares to the broker.</li></ol>The potential loss in short selling is theoretically unlimited.`,
                quiz: {
                    question: 'What is the primary risk of short selling?',
                    options: ['Limited profit potential', 'Unlimited loss potential', 'Paying high dividends', 'The stock price going to zero'],
                    answer: 1
                }
            }
        ]
      },
      {
        id: 7,
        title: 'Trading Psychology',
        intro: "This final module addresses the most critical aspect of trading: psychology. A trader can have a perfect system, but if they cannot master their own emotions and cognitive biases, they are destined to fail. Trading is a battle against oneself.",
        lessons: [
            {
                title: 'The Two Driving Forces: Fear and Greed',
                content: `The market is often said to be driven by two emotions:<ul><li><b>Greed:</b> An irrational desire for wealth, leading to chasing performance and taking excessive risk.</li><li><b>Fear:</b> The emotional response to loss, leading to panic selling or "analysis paralysis."</li></ul>`,
                quiz: {
                    question: 'Panic selling is most often associated with which emotion?',
                    options: ['Greed', 'Confidence', 'Fear', 'Apathy'],
                    answer: 2
                }
            },
            {
                title: 'Common Behavioral Biases',
                content: `Recognizing mental traps is the first step to avoiding them. Common biases include:<ul><li><b>Herd Instinct:</b> Following the crowd, often leading to buying high and selling low.</li><li><b>Anchoring:</b> Relying too heavily on an initial piece of information, like your purchase price.</li><li><b>Overconfidence:</b> Overestimating your skill, leading to excessive risk-taking.</li><li><b>Confirmation Bias:</b> Seeking information that confirms your beliefs and ignoring contradictory evidence.</li></ul>`,
                quiz: {
                    question: 'Buying a stock just because everyone else is buying it is an example of:',
                    options: ['Anchoring', 'Overconfidence', 'Herd Instinct', 'Confirmation Bias'],
                    answer: 2
                }
            },
            {
                title: 'Developing a Trading Plan and Journal',
                content: `The best antidote to emotion is a <b>trading plan</b>: a written set of rules for entry, exit, and risk management created when you are objective. A <b>trading journal</b> is another powerful tool. By recording every trade, its rationale, and your emotions, you can objectively review your performance and identify recurring mistakes.`,
                quiz: {
                    question: 'What is the main purpose of a trading plan?',
                    options: ['To guarantee profits', 'To eliminate all risk', 'To provide a set of objective rules to follow', 'To share tips with friends'],
                    answer: 2
                }
            }
        ]
      }
    ]
  },
  crypto: {
    title: 'Cryptocurrency',
    modules: [
      {
        id: 8,
        title: 'Crypto Foundations',
        intro: "This module lays the technological and conceptual groundwork for understanding the crypto space. It explains the fundamental innovations that make digital assets possible and defines the key terms and projects that form the basis of the ecosystem.",
        lessons: [
            {
                title: 'What is Blockchain Technology?',
                content: `Blockchain is a decentralized, distributed, and immutable digital ledger. <ul><li><b>Decentralized:</b> Controlled by no single entity.</li><li><b>Distributed:</b> Copied and spread across many computers.</li><li><b>Immutable:</b> Transactions are cryptographically secured and nearly impossible to alter once recorded.</li></ul>This allows for secure peer-to-peer transactions without a central intermediary like a bank.`,
                quiz: {
                  question: 'What does "immutable" mean in the context of blockchain?',
                  options: ['It is controlled by a central bank', 'Transactions can be easily changed', 'Transactions are nearly impossible to alter once recorded', 'It is a physical ledger'],
                  answer: 2
                }
            },
            {
                title: 'Coins vs. Tokens',
                content: `Though often used interchangeably, there's a key difference:<ul><li><b>Coins (e.g., BTC, ETH):</b> Are native to their own independent blockchain. They are the "currency" of the network.</li><li><b>Tokens (e.g., UNI, LINK):</b> Are built on top of an existing blockchain (most commonly Ethereum). They don't have their own blockchain and are easier to create.</li></ul> In short: coins have their own blockchains; tokens live on other coins' blockchains.`,
                quiz: {
                  question: 'Which of the following is considered a "coin" because it has its own blockchain?',
                  options: ['UNI (Uniswap)', 'LINK (Chainlink)', 'ETH (Ethereum)', 'SHIB (Shiba Inu)'],
                  answer: 2
                }
            },
            {
                title: 'Bitcoin (BTC): The Original',
                content: `Created in 2008, Bitcoin is the first decentralized digital currency. Its primary use cases have evolved to be a <b>medium of exchange</b> and, more prominently, a <b>store of value</b>, often called "digital gold" due to its fixed supply of 21 million coins.`,
                quiz: {
                  question: 'What is a primary use case for Bitcoin?',
                  options: ['Running smart contracts', 'A store of value', 'Creating decentralized apps', 'Powering private blockchains'],
                  answer: 1
                }
            },
            {
                title: 'Ethereum (ETH): The World Computer',
                content: `Ethereum introduced <b>smart contracts</b>—self-executing contracts with their terms written into code. This transformed blockchain from just money into a programmable platform. If Bitcoin is a calculator, Ethereum is a global computer on which developers can build <b>decentralized applications (dApps)</b> for things like DeFi and NFTs.`,
                quiz: {
                  question: 'What key innovation did Ethereum introduce?',
                  options: ['Proof-of-Work', 'A fixed supply of coins', 'Smart Contracts', 'Anonymity'],
                  answer: 2
                }
            }
        ]
      },
      {
        id: 9,
        title: 'Navigating the Ecosystem',
        intro: "This module provides the practical skills to interact with the crypto world safely. It covers the core tools for storing and trading assets and emphasizes the crucial security practices and philosophical choices every participant must make.",
        lessons: [
            {
                title: 'Crypto Wallets: Hosted, Self-Custody, Hardware',
                content: `A wallet stores your private keys, which prove ownership. Types include:<ul><li><b>Hosted (Custodial):</b> Managed by an exchange (e.g., Coinbase). Easiest for beginners, but you don't control your keys.</li><li><b>Self-Custody (Software):</b> You control your keys via a "seed phrase" (e.g., MetaMask). More responsibility.</li><li><b>Hardware (Cold):</b> A physical device that stores keys offline. Most secure option.</li></ul>`,
                quiz: {
                    question: 'Which type of wallet offers the highest level of security?',
                    options: ['Hosted Wallet', 'Self-Custody (Software) Wallet', 'Hardware (Cold) Wallet', 'Paper Wallet'],
                    answer: 2
                }
            },
            {
                title: 'Centralized vs. Decentralized Exchanges',
                content: `Exchanges are marketplaces for trading crypto. A <b>Centralized Exchange (CEX)</b> is run by a company, holds your funds, and requires personal info (KYC). A <b>Decentralized Exchange (DEX)</b> runs on smart contracts, is non-custodial (you keep your funds), and is anonymous.`,
                quiz: {
                    question: 'What is a key feature of a Decentralized Exchange (DEX)?',
                    options: ['It requires you to submit personal ID', 'It is run by a single company', 'It is non-custodial, meaning you control your funds', 'It has a customer support hotline'],
                    answer: 2
                }
            },
            {
                title: 'How to Securely Buy and Sell',
                content: `For beginners, the typical path is: <ol class="list-decimal list-inside"><li>Register on a reputable Centralized Exchange (CEX).</li><li>Fund your account with fiat currency.</li><li>Place a buy order.</li><li><b>Crucial Step:</b> For significant amounts or long-term holding, withdraw your crypto from the exchange to a personal hardware wallet.</li></ol> Remember the crypto mantra: <b>"Not your keys, not your coins."</b> If you don't control the private keys, you don't truly own the assets.`,
                quiz: {
                    question: 'The phrase "Not your keys, not your coins" emphasizes the importance of:',
                    options: ['Trading on multiple exchanges', 'Using self-custody wallets', 'Only buying Bitcoin', 'Keeping your crypto on an exchange'],
                    answer: 1
                }
            }
        ]
      },
      {
        id: 10,
        title: 'Crypto Analysis & Valuation',
        intro: "Valuing crypto assets requires a unique, hybrid approach. This module adapts traditional analysis and introduces new, crypto-native methodologies for researching projects and understanding their potential value.",
        lessons: [
            {
                title: 'How to Research an Altcoin Project',
                content: `With thousands of coins, due diligence is key. Evaluate a project on its:<ul><li><b>Use Case:</b> Does it solve a real problem?</li><li><b>Team:</b> Is the team public and experienced? (Anonymous teams are a red flag).</li><li><b>Competitors:</b> How does it stack up against rivals?</li><li><b>Community:</b> Is there a strong, active community?</li></ul>Use tools like Token Sniffer for a basic contract audit to avoid scams.`,
                quiz: {
                    question: 'When researching an altcoin, which of these is a potential RED flag?',
                    options: ['A public and experienced team', 'A clear use case', 'A strong community', 'An anonymous development team'],
                    answer: 3
                }
            },
            {
                title: 'The Crypto Whitepaper',
                content: `A whitepaper is a project's foundational document. A good one will clearly articulate the problem and solution, technical architecture, roadmap, and team. Be wary of vague marketing language and unrealistic claims.`,
                quiz: {
                    question: 'What is a crypto whitepaper?',
                    options: ['A legal share certificate', 'A project\'s foundational technical and mission document', 'A daily price report', 'A list of wallet addresses'],
                    answer: 1
                }
            },
            {
                title: 'Understanding Tokenomics',
                content: `Tokenomics is the economic model of a token. Key factors:<ul><li><b>Supply:</b> Is it capped (like Bitcoin) or inflationary?</li><li><b>Distribution:</b> How were tokens allocated? A large, unlocked allocation to insiders is a red flag.</li><li><b>Utility:</b> What is the token's purpose? Strong utility creates built-in demand.</li></ul>`,
                quiz: {
                    question: 'Tokenomics primarily refers to the...',
                    options: ['Technical code of the token', 'Economic model and properties of a token', 'Marketing strategy for a token', 'Legal regulations for a token'],
                    answer: 1
                }
            },
            {
                title: 'Applying Technical Analysis to Crypto',
                content: `TA principles (trends, patterns, indicators) work in crypto, but with key differences: the market is 24/7 and far more volatile. Indicators may behave differently, and trends can move faster.`,
                quiz: {
                    question: 'A key difference when applying TA to crypto vs. stocks is:',
                    options: ['Crypto markets are only open on weekdays', 'Crypto markets are less volatile', 'Crypto markets are open 24/7', 'TA does not work for crypto'],
                    answer: 2
                }
            },
            {
                title: 'Introduction to On-Chain Analysis',
                content: `This crypto-native analysis involves examining data directly from the public blockchain. Key metrics include:<ul><li><b>Active Addresses:</b> Signals user growth.</li><li><b>Exchange Flows:</b> Large outflows can be bullish (long-term holding), while large inflows can be bearish (intent to sell).</li><li><b>Hash Rate:</b> A rising hash rate indicates a strong, secure network.</li></ul>`,
                quiz: {
                    question: 'On-chain analysis involves looking at data from where?',
                    options: ['Social media websites', 'News articles', 'The blockchain itself', 'Company financial statements'],
                    answer: 2
                }
            }
        ]
      },
      {
        id: 11,
        title: 'Decentralized Finance (DeFi)',
        intro: "This module explores DeFi, one of the most innovative crypto sectors. DeFi aims to rebuild the traditional financial system (lending, borrowing, trading) on open blockchains, removing intermediaries like banks.",
        lessons: [
            {
                title: 'What is DeFi?',
                content: `DeFi refers to financial applications built on blockchains using smart contracts to automate processes. It aims to create an open, permissionless, and transparent financial system.`,
                quiz: {
                    question: 'What is the main goal of DeFi?',
                    options: ['To create a more centralized financial system', 'To rebuild traditional finance without intermediaries', 'To replace all cryptocurrencies with one coin', 'To regulate banks more heavily'],
                    answer: 1
                }
            },
            {
                title: 'Earning Passive Income in DeFi',
                content: `DeFi enables new ways to earn a return ("yield") on your assets:<ul><li><b>Staking:</b> Locking up crypto to help secure a Proof-of-Stake network in return for rewards.</li><li><b>Lending:</b> Depositing crypto into a lending protocol (e.g., Aave) to earn interest from borrowers.</li><li><b>Providing Liquidity:</b> Depositing a pair of tokens into a liquidity pool on a Decentralized Exchange (e.g., Uniswap) to earn a share of trading fees.</li></ul>`,
                quiz: {
                    question: 'In DeFi, what is "staking"?',
                    options: ['Borrowing assets to short them', 'A type of crypto wallet', 'Locking up crypto to help secure a network for rewards', 'Day trading on a decentralized exchange'],
                    answer: 2
                }
            },
            {
                title: 'Key Risks in DeFi',
                content: `High yields in DeFi are compensation for taking on significant risks:<ul><li><b>Impermanent Loss (IL):</b> A unique risk for liquidity providers where the value of your deposited assets can be less than if you had simply held them, due to price changes.</li><li><b>Smart Contract Risk:</b> A bug or exploit in a protocol's code can be exploited by hackers, leading to a permanent loss of all funds in the protocol.</li></ul>`,
                quiz: {
                    question: 'A bug in a DeFi protocol\'s code is an example of what kind of risk?',
                    options: ['Market Risk', 'Impermanent Loss', 'Smart Contract Risk', 'Regulatory Risk'],
                    answer: 2
                }
            }
        ]
      },
      {
        id: 12,
        title: 'Advanced Crypto Topics',
        intro: "This final module delves into the most speculative corners of the crypto market, including complex derivatives and emerging digital economies. These areas offer high potential returns but also carry the highest levels of risk.",
        lessons: [
            {
                title: 'Crypto Derivatives: Perpetual Swaps',
                content: `Derivatives let you speculate on price without owning the asset. The most popular in crypto are <b>perpetual swaps</b>, a type of futures contract with no expiration date. They allow high leverage but come with extreme risk of <b>liquidation</b> (your position being forcibly closed).`,
                quiz: {
                    question: 'What is the primary risk of trading perpetual swaps with high leverage?',
                    options: ['Low returns', 'Slow transactions', 'Liquidation (forced closing of your position)', 'Limited asset choices'],
                    answer: 2
                }
            },
            {
                title: 'NFTs and the Metaverse',
                content: `<ul><li><b>NFTs (Non-Fungible Tokens):</b> Unique digital assets on a blockchain that prove ownership of an item (e.g., art, collectibles, in-game items).</li><li><b>The Metaverse:</b> A concept for a persistent, 3D virtual space.</li></ul>NFTs act as the property rights layer for the metaverse, allowing true ownership of virtual land, avatars, and items.`,
                quiz: {
                    question: 'What does "Non-Fungible" in NFT mean?',
                    options: ['It can be easily replaced by another identical item', 'It is unique and cannot be replaced one-for-one', 'It is a type of cryptocurrency', 'It has no owner'],
                    answer: 1
                }
            },
            {
                title: 'Crypto Market Cycles and Narratives',
                content: `Crypto markets are highly cyclical, often driven by the Bitcoin halving. Price action is also heavily influenced by powerful <b>narratives</b>—dominant stories (like "DeFi Summer" or "NFT Mania") that capture the market's attention and drive capital flows.`,
                quiz: {
                    question: 'What is a "narrative" in the context of crypto markets?',
                    options: ['A technical indicator', 'A blockchain security protocol', 'A dominant story that drives market attention and capital', 'A type of legal regulation'],
                    answer: 2
                }
            },
            {
                title: 'Navigating Crypto-Specific Risks',
                content: `Beyond normal market risks, crypto has unique challenges:<ul><li><b>Regulatory Uncertainty:</b> New laws can dramatically impact prices.</li><li><b>Hacks and Exploits:</b> The risk of theft due to security vulnerabilities is constant.</li><li><b>Extreme Volatility:</b> Price swings of 10-20% in a single day are common.</li></ul>`,
                quiz: {
                    question: 'Which of the following is a risk unique to the crypto space?',
                    options: ['Interest rate changes', 'Inflation', 'Regulatory Uncertainty', 'Company bankruptcy'],
                    answer: 2
                }
            }
        ]
      }
    ]
  }
};

const NAV_BLUE = '#2563eb';
const styles = {
  background: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
    padding: '2.5rem 0',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'row',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  sidebar: {
    minWidth: '220px',
    background: '#fff',
    borderRadius: '18px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    padding: '1.5rem 1rem',
    position: 'sticky',
    top: '2rem',
    height: 'fit-content',
  },
  sidebarTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#222',
  },
  moduleLink: (active) => ({
    display: 'block',
    padding: '0.7rem 1rem',
    borderRadius: '8px',
    marginBottom: '0.5rem',
    background: active ? '#E0EFFF' : 'none',
    color: active ? NAV_BLUE : '#444',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    border: 'none',
    textAlign: 'left',
    width: '100%',
    outline: 'none',
    transition: 'background 0.18s',
  }),
  main: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    padding: '2rem',
    marginBottom: '2rem',
  },
  lessonToggle: (locked) => ({
    width: '100%',
    textAlign: 'left',
    padding: '1rem',
    fontWeight: 600,
    fontSize: '1.1rem',
    background: locked ? '#f3f4f6' : 'none',
    border: 'none',
    borderBottom: '1px solid #f1f1f1',
    cursor: locked ? 'not-allowed' : 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    outline: 'none',
    color: locked ? '#aaa' : '#222',
  }),
  lessonContent: (open) => ({
    maxHeight: open ? '1000px' : '0',
    overflow: 'hidden',
    transition: 'max-height 0.5s ease-in-out',
    padding: open ? '1rem' : '0 1rem',
    color: '#444',
    background: '#f8fafc',
    borderRadius: '0 0 12px 12px',
    borderTop: open ? '1px solid #f1f1f1' : 'none',
  }),
  quiz: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: '#e0efff',
    borderRadius: '10px',
  },
  quizOption: (selected, correct, show, isIncorrect) => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '0.7rem 1rem',
    margin: '0.3rem 0',
    borderRadius: '8px',
    border: 'none',
    background: show
      ? (correct
          ? '#34d399'
          : isIncorrect
            ? '#f87171'
            : selected
              ? '#f87171'
              : '#fff')
      : '#fff',
    color: show
      ? (correct || isIncorrect || selected ? '#fff' : '#222')
      : '#222',
    fontWeight: 500,
    cursor: show ? 'default' : 'pointer',
    outline: 'none',
    transition: 'background 0.18s',
  }),
  lockIcon: {
    marginLeft: '0.5rem',
    color: '#aaa',
    fontSize: '1.1rem',
  }
};

export default function EducationPage() {
  const [currentPart, setCurrentPart] = useState('stocks');
  const [currentModule, setCurrentModule] = useState(curriculumData.stocks.modules[0].id);
  const [openLessons, setOpenLessons] = useState({});

  const [lessonProgress, setLessonProgress] = useState({
    stocks: curriculumData.stocks.modules.map((mod) => mod.lessons.map((_, i) => i === 0)),
    crypto: curriculumData.crypto.modules.map((mod) => mod.lessons.map((_, i) => i === 0)),
  });

  const [quizState, setQuizState] = useState({});

  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Add a loading state for progress/quiz
  const [progressLoaded, setProgressLoaded] = useState(false);

  // Backend sync: load on mount if authenticated
  useEffect(() => {
    setProgressLoaded(false);
    if (isAuthenticated) {
      getEducationProgress().then(res => {
        if (res.data.progress) setLessonProgress(res.data.progress);
        if (res.data.quiz) setQuizState(res.data.quiz);
        // Update localStorage for offline fallback
        localStorage.setItem('eduProgress', JSON.stringify(res.data.progress));
        localStorage.setItem('eduQuiz', JSON.stringify(res.data.quiz));
        setProgressLoaded(true);
      }).catch(() => {
        setProgressLoaded(true);
      });
    } else {
      const savedProgress = JSON.parse(localStorage.getItem('eduProgress'));
      const savedQuiz = JSON.parse(localStorage.getItem('eduQuiz'));
      if (savedProgress) setLessonProgress(savedProgress);
      if (savedQuiz) setQuizState(savedQuiz);
      setProgressLoaded(true);
    }
  }, [isAuthenticated]);

  // Save to backend/localStorage on every change
  useEffect(() => {
    if (isAuthenticated) {
      setEducationProgress(lessonProgress, quizState);
    }
    localStorage.setItem('eduProgress', JSON.stringify(lessonProgress));
    localStorage.setItem('eduQuiz', JSON.stringify(quizState));
  }, [lessonProgress, quizState, isAuthenticated]);

  // Parse query params for part/module/lesson, but only after progress is loaded
  useEffect(() => {
    if (!progressLoaded) return;
    const params = new URLSearchParams(location.search);
    const part = params.get('part');
    const moduleId = params.get('module');
    const lessonIdx = params.get('lesson');
    if (part && curriculumData[part]) {
      setCurrentPart(part);
      if (moduleId) {
        const modIdNum = Number(moduleId);
        setCurrentModule(modIdNum);
        if (lessonIdx !== null && !isNaN(Number(lessonIdx))) {
          // Open the lesson if it's unlocked
          const modIdx = curriculumData[part].modules.findIndex(m => m.id === modIdNum);
          if (modIdx !== -1 && lessonProgress[part]?.[modIdx]?.[Number(lessonIdx)]) {
            setOpenLessons({ [`${part}-${modIdNum}-${lessonIdx}`]: true });
          }
        }
      }
    }
  }, [location.search, lessonProgress, progressLoaded]);

  const handlePartClick = (part) => {
    setCurrentPart(part);
    const firstModuleId = curriculumData[part].modules[0].id;
    setCurrentModule(firstModuleId);
    setOpenLessons({});
  };

  const handleModuleClick = (id) => {
    setCurrentModule(id);
    setOpenLessons({});
  };

  const handleLessonToggle = (lessonKey, locked) => {
    if (locked) return;
    setOpenLessons((prev) => ({
      ...prev,
      [lessonKey]: !prev[lessonKey]
    }));
  };

  const handleQuizSelect = (lessonKey, lessonIdx, optionIdx) => {
    // Only lock if correct; allow retry if incorrect
    const activeModule = curriculumData[currentPart].modules.find(m => m.id === currentModule);
    const activeModuleIdx = curriculumData[currentPart].modules.findIndex(m => m.id === currentModule);
    const correct = activeModule.lessons[lessonIdx].quiz.answer === optionIdx;
    setQuizState((prev) => ({
      ...prev,
      [lessonKey]: { selected: optionIdx, answered: correct, correct }
    }));
    if (correct) {
      setLessonProgress((prev) => {
        const newProgress = { ...prev };
        const partProgress = [...newProgress[currentPart]];
        const moduleProgress = [...partProgress[activeModuleIdx]];
        if (lessonIdx + 1 < moduleProgress.length) {
          moduleProgress[lessonIdx + 1] = true;
        }
        partProgress[activeModuleIdx] = moduleProgress;
        newProgress[currentPart] = partProgress;
        return newProgress;
      });
    }
  };

  const activePartData = curriculumData[currentPart];
  const activeModule = activePartData.modules.find(m => m.id === currentModule);
  const activeModuleIdx = activePartData.modules.findIndex(m => m.id === currentModule);

  // Render nothing until progress is loaded
  if (!progressLoaded) return <div style={{padding:'2rem'}}>Loading progress...</div>;

  return (
    <div style={{ ...styles.background, position: 'relative' }}>
      <div style={styles.container}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Curriculum</div>
          <button
            style={styles.moduleLink(currentPart === 'stocks')}
            onClick={() => handlePartClick('stocks')}
          >📈 Stock Market</button>
          <button
            style={styles.moduleLink(currentPart === 'crypto')}
            onClick={() => handlePartClick('crypto')}
          >🪙 Cryptocurrency</button>
          <hr style={{margin: '1rem 0', borderColor: '#f1f1f1'}} />
          <div style={styles.sidebarTitle}>Modules</div>
          {activePartData.modules.map(module => (
            <button
              key={module.id}
              style={styles.moduleLink(currentModule === module.id)}
              onClick={() => handleModuleClick(module.id)}
            >
              {module.title}
            </button>
          ))}
        </aside>
        
        <main style={styles.main}>
          {activeModule && (
            <div style={styles.card}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#222' }}>{activeModule.title}</h2>
              <p style={{ color: '#555', marginBottom: '1.5rem' }} dangerouslySetInnerHTML={{ __html: activeModule.intro }}></p>
              <div>
                {activeModule.lessons.map((lesson, idx) => {
                  const lessonKey = `${currentPart}-${activeModule.id}-${idx}`;
                  const locked = !lessonProgress[currentPart][activeModuleIdx][idx];
                  const open = !!openLessons[lessonKey];
                  const quiz = lesson.quiz;
                  const quizResult = quizState[lessonKey];
                  return (
                    <div key={lessonKey} style={{ marginBottom: '1.2rem', border: '1px solid #f1f1f1', borderRadius: '12px', overflow: 'hidden', opacity: locked ? 0.6 : 1 }}>
                      <button style={styles.lessonToggle(locked)} onClick={() => handleLessonToggle(lessonKey, locked)}>
                        <span>{lesson.title}</span>
                        {locked ? <span style={styles.lockIcon}>🔒</span> : <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>}
                      </button>
                      <div style={styles.lessonContent(open)}>
                        {/* Hide lesson content when quiz is being taken (i.e., after any option is selected) */}
                        {!(quizResult && quizResult.selected !== undefined) && (
                          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                        )}
                        {quiz && (
                          <div style={styles.quiz}>
                            <div style={{ fontWeight: 600, marginBottom: '0.7rem' }}>{quiz.question}</div>
                            {quiz.options.map((opt, oidx) => (
                              <button
                                key={oidx}
                                style={styles.quizOption(
                                  quizResult?.selected === oidx,
                                  quiz.answer === oidx,
                                  quizResult?.answered || quizResult?.selected !== undefined,
                                  quizResult && quizResult.selected === oidx && quizResult.selected !== quiz.answer // highlight incorrect
                                )}
                                onClick={() => handleQuizSelect(lessonKey, idx, oidx)}
                                disabled={quizResult?.answered && quizResult?.correct}
                              >
                                {opt}
                              </button>
                            ))}
                            {quizResult && (
                              <div style={{ marginTop: '0.7rem', color: quizResult.correct ? '#34d399' : '#f87171', fontWeight: 600 }}>
                                {quizResult.answered && quizResult.correct
                                  ? 'Correct!'
                                  : quizResult.selected !== undefined
                                    ? 'Incorrect'
                                    : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
