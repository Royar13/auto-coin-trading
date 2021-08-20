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
        if (this.state.exchangeRatesMat) {
            let th = [];
            if (this.props.config) {
                th = this.props.config.tokens.map(token =>
                    <th>{token.unit}</th>
                );
            }
            headerRow = <tr>{th}</tr>
            tr = this.state.exchangeRatesMat.map(row => {

                let td = row.map(col =>
                    <td>
                        {col}
                    </td>
                );
                return (
                    <tr>
                        {td}
                    </tr>
                );
            });
        }

        return (
            <table id="exchange-rates">
                <caption>Exchange Rates</caption>
                <thead>
                {headerRow}
                </thead>
                <tbody>
                {tr}
                </tbody>
            </table>
        );
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
                console.error(error);
            });
    }
}

export default ExchangeRatesTable;
