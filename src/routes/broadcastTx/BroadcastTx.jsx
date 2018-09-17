import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Service from '../../lib/Service';
import Loading from '../../components/Loading/Loading.jsx';
import Button from '../../components/buttons/Button.jsx';
import ButtonToolbar from '../../components/buttons/ButtonToolbar.jsx';
import SuccessMessage from '../../components/messages/SuccessMessage.jsx';
import ErrorMessage from '../../components/messages/ErrorMessage.jsx';
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
          <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
            Broadcast raw transaction
          </h1>
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label>
                This page allows you to paste a Signed Raw Transaction in hex format (i.e.
                characters 0-9, a-f) and broadcast it over the zen protocol network.
              </label>
              <div className="textarea-container position-relative">
                {progress && <Loading />}

                <textarea className="form-control" value={tx} onChange={this.handleChange} />
              </div>
            </div>
            <div className="row no-gutters">
              <div className="col">
                {response && (
                  <SuccessMessage>
                    Your tx was broadcasted successfully - once it is included in a block you can
                    view it here -{' '}
                    <Link to={`/tx/${response}`} className="break-word">
                      https://zp.io/tx/
                      {response}
                    </Link>
                    
                  </SuccessMessage>
                )}
                {error && <ErrorMessage>{error}</ErrorMessage>}
              </div>
              <div className="col">
                <ButtonToolbar className="d-flex justify-content-end">
                  {clipboardApiSupported() && (
                    <Button onClick={this.pasteFromClipboard} type="dark-2">
                      <i className="fal fa-paste" /> Paste
                    </Button>
                  )}
                  <Button isSubmit={true} disabled={this.submitDisabled()}>
                    Broadcast Tx
                  </Button>
                </ButtonToolbar>
              </div>
            </div>
          </form>
        </section>
      </div>
    );
  }

  handleChange(event) {
    this.setState({ tx: event.target.value.trim(), error: '', response: '' });
  }

  handleSubmit(event) {
    event.preventDefault();
    const INVALID_TXT = 'Invalid transaction';

    const { tx } = this.state;
    if (!this.txValid(tx)) {
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
    return tx.length > 0 && /([^a-fA-F0-9])/g.test(tx) === false;
  }

  submitDisabled() {
    return this.state.progress || !this.txValid(this.state.tx);
  }
}

export default BroadcastTx;
