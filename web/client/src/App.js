import axios from 'axios';
import React from 'react';
import './App.css';
import Settings from './settings'
import ExchangeRatesTable from './ExchangeRatesTable'

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            config: null,
            arbitrageCycle: null,
            showArbitrageCycle: false,
            balance: null,
            balanceUnit: null,
            expectedProfit: null
        };
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
                this.state.showArbitrageCycle = true
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
                cycle = this.state.arbitrageCycle.map(c => this.state.config.tokens[c].name).join('-->');
            }
        }

        return (
            <div>
                <ul id="tokens-list">
                    {listItems}
                </ul>
                <ExchangeRatesTable config={this.state.config}/>
                <button onClick={() => this.findArbitrageCycle()}>Find arbitrage cycle</button>
                {this.state.showArbitrageCycle &&
                <div>
                    <div>
                        {cycle}
                    </div>
                    {this.state.balance &&
                    <div>
                        <div>
                            Your balance: {this.state.balance} {this.state.balanceUnit}
                        </div>
                        <div>
                            How much would you like to invest?<br/>
                            <div id="amount-init">
                                <input type="number" min="0" max={this.state.balance}/>
                                <button onClick={() => this.calculateExpectedProfit()}>Calculate Expected Profit
                                </button>
                                {this.state.expectedProfit && <div>

                                </div>}
                            </div>
                            <br/>
                            <button onClick={() => this.performArbitrage()}>Perform Arbitrage</button>
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