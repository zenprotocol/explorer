import React, { Component } from 'react';
import Service from '../../lib/Service';
import Loading from '../../components/Loading/Loading.jsx';
import Button from '../../components/buttons/Button.jsx';
import './BroadcastTx.css';
import '../page.css';

const clipboardApiSupported = () => {
  return (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    !navigator.userAgent.toLowerCase().includes('opr')
  );
};

class BroadcastTx extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tx: '',
      progress: false,
      response: '',
      error: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.pasteFromClipboard = this.pasteFromClipboard.bind(this);
  }

  componentWillUnmount() {
    this.cancelCurrentRequest();
  }

  render() {
    const { tx, progress, response, error } = this.state;

    return (
      <div className="BroadcastTx">
        <section>
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label>
                This page allows you to paste a Signed Raw Transaction in hex format (i.e.
                characters 0-9, a-f) and broadcast it over the zen protocol network.
              </label>
              <div className="textarea-container position-relative">
                {progress && <Loading />}
                {clipboardApiSupported() && (
                  <Button
                    onClick={this.pasteFromClipboard}
                    type="link"
                    className="btn-paste"
                    size="sm"
                    title="Paste from clipboard"
                  >
                    <i className="fal fa-paste" />
                  </Button>
                )}
                <textarea className="form-control" value={tx} onChange={this.handleChange} />
                <div className="valid-feedback" style={{ display: response ? 'block' : 'none' }}>
                  {response}
                </div>
                <div className="invalid-feedback" style={{ display: error ? 'block' : 'none' }}>
                  {error}
                </div>
              </div>
            </div>
            <Button isSubmit={true} disabled={this.state.progress}>
              Send Transaction
            </Button>
          </form>
        </section>
      </div>
    );
  }

  handleChange(event) {
    this.setState({ tx: event.target.value.trim() });
  }

  handleSubmit(event) {
    event.preventDefault();
    const INVALID_TXT = 'Invalid transaction';

    const { tx } = this.state;
    if (tx.length === 0 || !this.txValid(tx)) {
      this.setState({ error: INVALID_TXT });
    } else {
      this.setState({ progress: true, response: '', error: '' });
      this.cancelCurrentRequest();
      this.currentPromise = Service.transactions.broadcast(tx);
      this.currentPromise
        .then(res => {
          this.setState({ response: res.data, tx: '' });
        })
        .catch(() => {
          this.setState({ error: INVALID_TXT });
        })
        .then(() => {
          this.setState({ progress: false });
        });
    }
  }

  cancelCurrentRequest() {
    if (this.currentPromise && this.currentPromise.cancel) {
      this.currentPromise.cancel();
    }
  }

  pasteFromClipboard() {
    if (navigator.clipboard) {
      try {
        navigator.clipboard
          .readText()
          .then(text => {
            this.setState({ tx: text });
          })
          .catch(err => {
            console.log(err);
          });
      } catch (error) {
        console.log(error);
      }
    }
  }

  txValid(tx) {
    return /([^a-fA-F0-9])/g.test(tx) === false;
  }
}

export default BroadcastTx;
