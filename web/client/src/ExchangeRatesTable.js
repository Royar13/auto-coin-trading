import React from 'react';
import axios from "axios";
import Settings from './settings'
import './ExchangeRatesTable.css';

class ExchangeRatesTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            exchangeRatesMat: null
        };
    }

    render() {
        let tr = [];
        let headerRow;
        if (this.state.exchangeRatesMat && this.props.config) {
            let th = [];
            th = this.props.config.tokens.map((token, i) =>
                <th key={i + 1}>{token.unit}</th>
            );
            th = [<th key="0"></th>].concat(th);
            headerRow = <tr>{th}</tr>
            tr = this.state.exchangeRatesMat.map((row, i) => {
                let td = row.map((col, i) => {
                    let num = Math.round(col * 1000) / 1000;
                    return (
                        <td key={i + 1}>
                            {num}
                        </td>
                    );
                });
                td = [<td key="0">{this.props.config.tokens[i].unit}</td>].concat(td);
                return (
                    <tr key={i}>
                        {td}
                    </tr>
                );
            });
        }

        return (
            <div>
                <table id="exchange-rates">
                    <caption>Exchange Rates (Uniswap<img src={process.env.PUBLIC_URL + "/uniswap-uni-logo-small.png"}
                                                         alt="Uniswap logo"/>):
                    </caption>
                    <thead>
                    {headerRow}
                    </thead>
                    <tbody>
                    {tr}
                    </tbody>
                </table>
                {
                    this.state.error &&
                    <div className="error">
                        {this.state.error}
                    </div>
                }
            </div>
        )
            ;
    }

    componentDidMount() {
        let url = Settings.API_URL + '/calculateExchangeRatesMat';
        axios.get(url)
            .then(result => {
                this.setState({
                    exchangeRatesMat: result.data['exchangeRatesMat']
                });
            })
            .catch(error => {
                this.setState({
                    error: error.response.data
                });
            });
    }
}

export default ExchangeRatesTable;
