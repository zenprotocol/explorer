import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { Helmet } from 'react-helmet';
import Service from '../../lib/Service';
import TextUtils from '../../lib/TextUtils';
import RouterUtils from '../../lib/RouterUtils';
import BrowserUtils from '../../lib/BrowserUtils';
import Loading from '../../components/Loading';
import Button from '../../components/buttons/Button';
import ButtonToolbar from '../../components/buttons/ButtonToolbar';
import { SuccessMessage } from '../../components/messages';
import { ErrorMessage } from '../../components/messages';
import { TransactionAsset } from '../../components/Transactions';
import Page from '../../components/Page';
import './BroadcastTx.scss';

const INVALID_TXT = 'Invalid transaction';
const BROADCAST_FAILED_TXT = 'Oops! Something Went Wrong.';
const PAGE_TITLE = 'Broadcast raw tx';

class BroadcastTx extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hex: '',
      hexReadOnly: false,
      decodedTx: null,
      decodedTxValid: false,
      progress: false,
      broadcastResponse: '',
      error: '',
      clipboardApiSupported: false,
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.pasteFromClipboard = this.pasteFromClipboard.bind(this);
    this.handleHexChange = debounce(this.handleHexChange, 500);
  }

  componentDidMount() {
    this.checkClipboardApiSupported();
    this.initHexFromRouteParam();
  }

  componentWillUnmount() {
    this.cancelCurrentSubmitRequest();
    this.cancelCurrentDecodeRequest();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.hex !== prevState.hex) {
      this.handleHexChange(this.state.hex);
    }
  }

  render() {
    const { hex, progress, broadcastResponse, error } = this.state;
    return (
      <Page className="BroadcastTx">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Broadcast a Transaction')}</title>
        </Helmet>
        <section>
          <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">{PAGE_TITLE}</h1>
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label>
                This page allows you to paste a Signed Raw Transaction in hex format (i.e.
                characters 0-9, a-f) and broadcast it over the zen protocol network.
              </label>
              <div className="textarea-container position-relative">
                {progress && <Loading />}
                <textarea
                  className="form-control"
                  value={hex}
                  onChange={this.handleInputChange}
                  readOnly={this.state.hexReadOnly}
                />
              </div>
            </div>
            <div className="assets">
              {(this.state.decodedTx || []).length > 0 &&
                this.state.decodedTx.map((asset, assetIndex) => {
                  return (
                    <TransactionAsset
                      transactionAsset={asset}
                      asset={asset.asset}
                      key={assetIndex}
                      showHeader={assetIndex === 0}
                      total={Number(asset.total)}
                    />
                  );
                })}
            </div>
            <div className="row no-gutters">
              <div className="col">
                {broadcastResponse && (
                  <SuccessMessage>
                    Your tx was broadcasted successfully - once it is included in a block you can
                    view it here -{' '}
                    <Link to={`/tx/${broadcastResponse}`} className="break-word">
                      https://zp.io/tx/
                      {broadcastResponse}
                    </Link>
                  </SuccessMessage>
                )}
                {error && <ErrorMessage>{error}</ErrorMessage>}
              </div>
              <div className="col">
                <ButtonToolbar className="d-flex justify-content-end">
                  {this.state.clipboardApiSupported &&
                    !this.state.hexReadOnly && (
                      <Button onClick={this.pasteFromClipboard} type="dark-2">
                        <i className="fal fa-paste" /> Paste
                      </Button>
                    )}
                  <Button isSubmit={true} disabled={this.submitDisabled}>
                    Broadcast Tx
                  </Button>
                </ButtonToolbar>
              </div>
            </div>
          </form>
        </section>
      </Page>
    );
  }

  initHexFromRouteParam() {
    const { hex } = RouterUtils.getRouteParams(this.props);
    if (hex) {
      this.setState({ hex, hexReadOnly: true });
    }
  }

  handleInputChange(event) {
    this.setState({
      hex: event.target.value.trim(),
      error: '',
      broadcastResponse: '',
    });
  }

  handleHexChange(hex) {
    if (this.state.hex !== '') {
      this.setState({ decodedTx: null, decodedTxValid: false, broadcastResponse: '', error: '' });

      if (this.hexValid(hex)) {
        this.decodeHex(hex);
      }
    }
  }

  decodeHex(hex) {
    this.cancelCurrentDecodeRequest();
    this.currentDecodePromise = Service.transactions.rawToTx(hex);
    this.currentDecodePromise
      .then(res => {
        this.setState({ decodedTx: res.data, decodedTxValid: true });
        this.setPageLocation(hex);
      })
      .catch(error => {
        const message = error.data.customMessage ? error.data.customMessage : INVALID_TXT;
        this.setState({
          decodedTx: null,
          decodedTxValid: false,
          error: message,
          hexReadOnly: false,
        });
      });
  }

  setPageLocation(hexToSet) {
    const { hex } = RouterUtils.getRouteParams(this.props);
    if (hexToSet !== hex) {
      this.props.history.replace(`/broadcastTx/${hexToSet}`);
    }
  }

  handleSubmit(event) {
    event.preventDefault();

    const { hex } = this.state;
    if (!this.hexValid(hex)) {
      this.setState({ error: INVALID_TXT });
    } else {
      this.setState({ progress: true, broadcastResponse: '', error: '' });
      this.cancelCurrentSubmitRequest();
      this.currentSubmitPromise = Service.transactions.broadcast(hex);
      this.currentSubmitPromise
        .then(res => {
          this.setState({ broadcastResponse: res.data, hex: '' });
        })
        .catch(() => {
          this.setState({ error: BROADCAST_FAILED_TXT });
        })
        .then(() => {
          this.setState({ progress: false });
        });
    }
  }

  cancelCurrentSubmitRequest() {
    if (this.currentSubmitPromise && this.currentSubmitPromise.cancel) {
      this.currentSubmitPromise.cancel();
    }
  }

  cancelCurrentDecodeRequest() {
    if (this.currentDecodePromise && this.currentDecodePromise.cancel) {
      this.currentDecodePromise.cancel();
    }
  }

  checkClipboardApiSupported() {
    this.setState({ clipboardApiSupported: BrowserUtils.clipboardApiSupported() });
  }

  pasteFromClipboard() {
    if (navigator.clipboard) {
      try {
        navigator.clipboard
          .readText()
          .then(text => {
            this.setState({ hex: text });
          })
          .catch(err => {
            console.log(err);
          });
      } catch (error) {
        console.log(error);
      }
    }
  }

  hexValid(hex) {
    return hex.length > 0 && /([^a-fA-F0-9])/g.test(hex) === false;
  }

  get submitDisabled() {
    return this.state.progress || !this.hexValid(this.state.hex) || !this.state.decodedTxValid;
  }
}

BroadcastTx.propTypes = {
  history: PropTypes.object,
};

export default BroadcastTx;
