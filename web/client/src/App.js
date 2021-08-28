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
            balance: null,
            balanceUnit: null,
            expectedProfit: null,
            amountIn: 0,
            arbitrageAction: null,
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
        this.setState({
            arbitrageCycle: {
                fetching: true
            },
            expectedProfit: null,
            arbitrageAction: null
        });
        axios.get(url)
            .then(result => {
                this.setState({
                    arbitrageCycle: {
                        cycle: result.data.cycle,
                        fetching: false
                    }
                });
                if (result.data.cycle) {
                    let token = this.state.config.tokens[result.data.cycle[0]];
                    this.getTokenBalance(token.address).then(val => {
                        this.setState({
                            balance: val,
                            balanceUnit: token.unit
                        });
                    });
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    calculateExpectedProfit() {
        this.setState({
            expectedProfit: {
                fetching: true
            }
        });
        let url = Settings.API_URL + '/calculateExpectedProfit';
        axios.get(url, {
            params: {
                amount: this.state.amountIn,
                cycle: this.state.arbitrageCycle.cycle
            }
        })
            .then(result => {
                this.setState({
                    expectedProfit: {
                        result: result.data,
                        fetching: false
                    }
                });
            })
            .catch(error => {
                this.setState({
                    expectedProfit: {
                        fetching: false,
                        error: error.response.data
                    }
                });
            });
    }

    performArbitrage() {
        this.setState({
            arbitrageAction: {
                fetching: true
            }
        });
        let url = Settings.API_URL + '/performArbitrage';
        axios.post(url, {
            amount: this.state.amountIn,
            cycle: this.state.arbitrageCycle.cycle
        })
            .then(result => {
                let actualProfit = result.data.profit - result.data.gasCostInToken;
                this.setState({
                    arbitrageAction: {
                        fetching: false,
                        result: {
                            profit: result.data.profit,
                            gasCost: result.data.gasCost,
                            actualProfit: actualProfit,
                            transactions: result.data.transactions
                        }
                    }
                });
            })
            .catch(error => {
                this.setState({
                    arbitrageAction: {
                        fetching: false,
                        error: error.response.data
                    }
                });
            });
    }

    handleAmountChange(e) {
        this.setState({amountIn: parseInt(e.target.value)});
    }

    isExecutingArbitrage() {
        return this.state.arbitrageAction && this.state.arbitrageAction.fetching;
    }

    isExecutingExpectedProfit() {
        return this.state.expectedProfit && this.state.expectedProfit.fetching;
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

            if (this.state.arbitrageCycle && this.state.arbitrageCycle.cycle) {
                cycle = this.state.arbitrageCycle.cycle.map(c => this.state.config.tokens[c].unit).join('-->');
            }
        }

        let transLi = [];
        if (this.state.arbitrageAction && this.state.arbitrageAction.result && this.state.arbitrageAction.result.transactions) {
            transLi = this.state.arbitrageAction.result.transactions.map((hash, i) =>
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
                <button onClick={() => this.findArbitrageCycle()}
                        disabled={this.isExecutingArbitrage() || (this.state.arbitrageCycle && this.state.arbitrageCycle.fetching)}>Find
                    Arbitrage Cycle
                </button>
                <div>
                    {this.state.arbitrageCycle && this.state.arbitrageCycle.fetching &&
                    <img className="loading-icon" src={process.env.PUBLIC_URL + "/loading-icon.gif"}
                         alt="loading icon"/>
                    }
                    {this.state.arbitrageCycle && !this.state.arbitrageCycle.fetching && !this.state.arbitrageCycle.cycle &&
                    <span>Did not find cycle</span>
                    }
                </div>
                {this.state.arbitrageCycle && this.state.arbitrageCycle.cycle &&
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
                                       disabled={this.isExecutingArbitrage() || this.isExecutingExpectedProfit()}/>
                                <button onClick={() => this.calculateExpectedProfit()}
                                        disabled={this.isExecutingArbitrage() || this.isExecutingExpectedProfit()}>Calculate
                                    Expected Profit
                                </button>
                                {this.isExecutingExpectedProfit() &&
                                <div>
                                    <img className="loading-icon" src={process.env.PUBLIC_URL + "/loading-icon.gif"}
                                         alt="loading icon"/>
                                </div>
                                }
                                {this.state.expectedProfit && this.state.expectedProfit.error &&
                                <div className="error">
                                    {this.state.expectedProfit.error}
                                </div>
                                }
                                {this.state.expectedProfit && this.state.expectedProfit.result && <div>
                                    <b>Expected
                                        profit:</b> {this.state.expectedProfit.result.profit} {this.state.balanceUnit}
                                    <br/>
                                    <b>Estimated gas
                                        price:</b> {this.state.expectedProfit.result.estimatedGasPrice} Ether <br/>
                                    <b>Expected net
                                        profit:</b> {this.state.expectedProfit.result.netProfit} {this.state.balanceUnit}
                                </div>}
                            </div>
                            <button onClick={() => this.performArbitrage()}
                                    disabled={this.isExecutingArbitrage()}>Perform Arbitrage
                            </button>
                            {this.isExecutingArbitrage() && <div>
                                <img className="loading-icon" src={process.env.PUBLIC_URL + "/loading-icon.gif"}
                                     alt="loading icon"/>
                            </div>}
                            {this.state.arbitrageAction && this.state.arbitrageAction.result &&
                            <div>
                                Arbitrage performed successfully!
                                <div id="arbitrage-result">
                                    <b>Profit:</b> {this.state.arbitrageAction.result.profit} {this.state.balanceUnit}<br/>
                                    <b>Gas cost:</b> {this.state.arbitrageAction.result.gasCost} Ether<br/>
                                    <b>Estimated net profit (after
                                        gas):</b> {this.state.arbitrageAction.result.actualProfit} {this.state.balanceUnit} (={this.fromWei(this.state.arbitrageAction.result.actualProfit)}x10<sup>{this.WEI_DECIMALS}</sup>)<br/>
                                    <b>Transactions:</b>
                                    <ul>
                                        {transLi}
                                    </ul>
                                </div>
                            </div>}
                            {this.state.arbitrageAction && this.state.arbitrageAction.error &&
                            <div className="error">
                                {this.state.arbitrageAction.error}
                            </div>
                            }
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
