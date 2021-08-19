import axios from 'axios';
import React from 'react';
import './App.css';
import Settings from './settings'

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            config: null
        };
    }

    render() {
        let listItems = [];
        if (this.state.config) {
            listItems = this.state.config.tokens.map((token) =>
                <li><h3>{token.name}</h3>
                    <span class="token-title">Unit:</span> <span class="token-field">{token.unit}</span>,&nbsp;
                    <span class="token-title">Address:</span> <span class="token-field">{token.address}</span>
                </li>
            );
        }

        return (
            <ul id="tokens-list">
                {listItems}
            </ul>
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
