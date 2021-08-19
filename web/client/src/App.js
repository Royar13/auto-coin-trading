import axios from 'axios';
import React from 'react';
import './App.css';
import Settings from './settings'

class App extends React.Component {
    render() {
        return (
            <div>
                Hello World
            </div>
        )
    }

    componentDidMount() {
        let url = Settings.API_URL + '/test';
        axios.post(url, {answer: 42})
            .then(result => {
                    console.log(result);
                }
            )
            .catch(error => {

            });
    }
}

export default App;
