import axios from 'axios';
import React from 'react';
import './App.css';
import Settings from './settings'
import ExchangeRatesTable from './ExchangeRatesTable'

class App extends React.Component {
    WEI_DECIMALS = 18;

    constructor(props) {
        super(props);
        this.state = {
            config: null,
            arbitrageCycle: null,
            showArbitrageCycle: false,
            balance: null,
            balanceUnit: null,
            expectedProfit: null,
            amountIn: 0,
            profit: null,
            executingArbitrage: false,
            gasCost: null,
            actualProfit: null,
            transactions: []
        };
    }

    fromWei(num) {
        const roundToDigits = 4;
        let numDigits = num.toString().length;
        let digitsRemoved = 0;
        if (numDigits > roundToDigits) {
            digitsRemoved = numDigits - roundToDigits;
            num = Math.round(num / Math.pow(10, digitsRemoved));
        }
        num /= Math.pow(10, this.WEI_DECIMALS - digitsRemoved);
        return num;
    }

    getTokenBalance(address) {
        let url = Settings.API_URL + '/getBalance';
        return axios.get(url, {params: {address: address}})
            .then(result => {
                return result.data.balance;
            })
            .catch(error => {
                console.error(error);
            });
    }

    findArbitrageCycle() {
        let url = Settings.API_URL + '/findArbitrageCycle';
        axios.get(url)
            .then(result => {
                this.setState({showArbitrageCycle: true});
                if (result.data.cycle) {
                    let token = this.state.config.tokens[result.data.cycle[0]];
                    this.getTokenBalance(token.address).then(val => {
                        this.setState({
                            balance: val,
                            balanceUnit: token.unit
                        });
                    });

                    this.setState({
                        arbitrageCycle: result.data.cycle
                    });
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    calculateExpectedProfit() {
        let url = Settings.API_URL + '/calculateExpectedProfit';
        axios.get(url, {
            params: {
                amount: this.state.amountIn,
                cycle: this.state.arbitrageCycle
            }
        })
            .then(result => {
                this.setState({
                    expectedProfit: result.data.profit
                });
            })
            .catch(error => {
                console.error(error);
            });
    }

    performArbitrage() {
        this.setState({
            executingArbitrage: true,
            profit: null
        });
        let url = Settings.API_URL + '/performArbitrage';
        axios.post(url, {
            amount: this.state.amountIn,
            cycle: this.state.arbitrageCycle
        })
            .then(result => {
                let actualProfit = result.data.profit - result.data.gasCostInToken;
                this.setState({
                    profit: result.data.profit,
                    gasCost: result.data.gasCost,
                    actualProfit: actualProfit,
                    transactions: result.data.transactions
                });
            })
            .catch(error => {
                console.error(error);
            })
            .finally(() => {
                this.setState({
                    executingArbitrage: false
                });
            });
    }

    handleAmountChange(e) {
        this.setState({amountIn: parseInt(e.target.value)});
    }

    render() {
        let listItems = [];
        let cycle = "No arbitrage cycle found";
        if (this.state.config) {
            listItems = this.state.config.tokens.map((token) =>
                <li key={token.unit}><h3>{token.name}</h3>
                    <span className="token-title">Unit:</span> <span className="token-field">{token.unit}</span>,&nbsp;
                    <span className="token-title">Address:</span> <span className="token-field">{token.address}</span>
                </li>
            );

            if (this.state.arbitrageCycle) {
                cycle = this.state.arbitrageCycle.map(c => this.state.config.tokens[c].unit).join('-->');
            }
        }

        let transLi = [];
        if (this.state.transactions) {
            transLi = this.state.transactions.map((hash, i) =>
                <li key={i}>
                    <a href={"https://rinkeby.etherscan.io/tx/" + hash} target="_blank"
                       rel="noreferrer">{hash}</a>
                </li>
            );
        }

        return (
            <div id="container">
                <div id="top-data">
                    <div id="tokens-list-init">
                        <h2>Tokens:</h2>
                        <ul id="tokens-list">
                            {listItems}
                        </ul>
                    </div>
                    <ExchangeRatesTable config={this.state.config}/>
                </div>
                <button onClick={() => this.findArbitrageCycle()} disabled={this.state.executingArbitrage}>Find
                    Arbitrage Cycle
                </button>
                {this.state.showArbitrageCycle &&
                <div id="arbitrage-init">
                    <div id="cycle-init">
                        <b>Cycle:</b>
                        <div>{cycle}</div>
                    </div>
                    {this.state.balance &&
                    <div>
                        <div id="balance-init">
                            <b>Your
                                balance</b>: {this.state.balance} {this.state.balanceUnit} (={this.fromWei(this.state.balance)}x10<sup>{this.WEI_DECIMALS}</sup>)
                        </div>
                        <div>
                            How much would you like to invest? (in {this.state.balanceUnit})<br/>
                            <div id="amount-init">
                                <input type="number" min="0" max={this.state.balance} value={this.state.amountIn}
                                       onChange={this.handleAmountChange.bind(this)}
                                       disabled={this.state.executingArbitrage}/>
                                <button onClick={() => this.calculateExpectedProfit()}
                                        disabled={this.state.executingArbitrage}>Calculate Expected Profit
                                </button>
                                {this.state.expectedProfit !== null && <div>
                                    <b>Expected
                                        profit</b>: {this.state.expectedProfit} {this.state.balanceUnit}
                                </div>}
                            </div>
                            <button onClick={() => this.performArbitrage()}
                                    disabled={this.state.executingArbitrage}>Perform Arbitrage
                            </button>
                            {this.state.executingArbitrage && <div>
                                <img className="loading-icon" src={process.env.PUBLIC_URL + "/loading-icon.gif"}
                                     alt="loading icon"/>
                            </div>}
                            {this.state.profit !== null && <div>
                                Arbitrage performed successfully!
                                <div id="arbitrage-result">
                                    <b>Profit:</b> {this.state.profit} {this.state.balanceUnit}<br/>
                                    <b>Gas cost (Ether):</b> {this.state.gasCost}<br/>
                                    <b>Estimated net profit (after
                                        gas):</b> {this.state.actualProfit} {this.state.balanceUnit} (={this.fromWei(this.state.actualProfit)}x10<sup>{this.WEI_DECIMALS}</sup>)<br/>
                                    <b>Transactions:</b>
                                    <ul>
                                        {transLi}
                                    </ul>
                                </div>
                            </div>}
                        </div>
                    </div>
                    }

                </div>
                }
            </div>
        )
    }

    componentDidMount() {
        let url = Settings.API_URL + '/getConfig';
        axios.get(url)
            .then(result => {
                this.setState({
                    config: result.data
                });
            })
            .catch(error => {
                console.error(error);
            });
    }
}

export default App;
