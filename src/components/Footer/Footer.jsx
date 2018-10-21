import React from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import uiStore from '../../store/UIStore';
import Config from '../../lib/Config';
import Logo from '../Logo';
import ExternalLink from '../ExternalLink';
import './Footer.css';

export default function Footer(props) {
  return (
    <footer className="Footer container">
      <div className="row">
        <div className="col-12">
          <Logo hideSubtitle={true} />
          <SyncNotification />
        </div>
      </div>
      <div className="row logo-padding">
        <div className="col-lg-7 border-dark separator">
          <FooterLinks />
        </div>
        <div className="col-lg-5">
          <FooterContact />
          <FooterSocial />
          <FooterCopyright />
        </div>
      </div>
    </footer>
  );
}

const SyncNotification = observer(function() {
  return (
    <div className="SyncNotification">
      {uiStore.syncing ? (
        <span className="syncing">
          <i className="icon far fa-spinner-third zen-spin" /> Syncing...
        </span>
      ) : (
        <span className="synced">
          <i className="icon fas fa-circle" /> Synced.
        </span>
      )}
    </div>
  );
});

function FooterLinks() {
  return (
    <div className="row FooterLinks">
      <div className="col-md-4">
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link className="nav-link text-nowrap" to="/broadcastTx">Broadcast Raw Tx</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-nowrap" to="/oracle">Oracle</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-nowrap" to="/templates/contract">Contract templates</Link>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              url="https://www.zenprotocol.com/deck/zen_protocol_deck_en.pdf"
            >
              Pitch Deck
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              target="_top"
              url="https://www.zenprotocol.com/files/zen_protocol_white_paper.pdf"
            >
              White Paper
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              target="_top"
              url="https://www.zenprotocol.com/files/technical_paper.pdf"
            >
              Technical Paper
            </ExternalLink>
          </li>
        </ul>
      </div>
      <div className="col-md-4">
        <ul className="nav flex-column">
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://docs.zenprotocol.com/">
              Documentation
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              url="https://docs.zenprotocol.com/preparation/installers"
            >
              Download Wallet
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://github.com/zenprotocol/ZFS-SDK">
              Developers SDK
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://docs.zenprotocol.com/api">
              Developers API
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://docs.zenprotocol.com/zen_js">
              Zen’s JS
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://testnet.zp.io">
              Testnet
            </ExternalLink>
          </li>
        </ul>
      </div>
      <div className="col-md-4">
        <ul className="nav flex-column">
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="http://blog.zenprotocol.com/">
              Blog
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://forum.zenprotocol.com/">
              Forum
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              url={`mailto:${Config.constants.zenInfoMail}`}
              target="_top"
            >
              Contact Us
            </ExternalLink>
          </li>
          <li className="nav-item text-nowrap">
            <ExternalLink
              className="nav-link d-inline-block text-nowrap pr-0"
              url="https://www.zenprotocol.com/privacy?locale=en"
            >
              Privacy
            </ExternalLink>
            <span> &amp; </span>
            <ExternalLink
              url="https://www.zenprotocol.com/legal/zen_protocol_token_sale_agreement.pdf"
              className="nav-link text-nowrap d-inline-block pl-0"
            >
              Terms
            </ExternalLink>
          </li>
        </ul>
      </div>
    </div>
  );
}

function FooterContact() {
  return (
    <ul className="nav flex-column">
      <li className="nav-item text-nowrap">
        <span className="nav-link">
          Contact us:{' '}
          <ExternalLink className=" pl-0 d-inline-block" target="_top" url={`mailto:${Config.constants.zenInfoMail}`}>
            {Config.constants.zenInfoMail}
          </ExternalLink>
        </span>
      </li>
    </ul>
  );
}

// function FooterNewsSubscribe() {
//   return (
//     <div className="subscribe-form">
//       <p className="footer-title">Subscribe to Zen Protocol news</p>
//       <p className="show-for-small-only">Send us an email and we will get back to you ASAP.</p>
//       <form
//         action="https://zenprotocol.us16.list-manage.com/subscribe/post?u=2d338b2589df4f1d3cf5e6c2a&amp;id=3ffe2cc5fa"
//         method="post"
//         id="mc-embedded-subscribe-form"
//         name="mc-embedded-subscribe-form"
//         className="validate"
//         target="_blank"
//         rel="noopener noreferrer"
//         novalidate=""
//       >
//         <div className="input-group">
//           <input
//             placeholder="Your email"
//             type="email"
//             value=""
//             name="EMAIL"
//             className="input-group-field"
//             id="mce-EMAIL"
//           />
//           <div id="mce-responses" className="clear">
//             <div className="response" id="mce-error-response" style={{display:'none'}} />
//             <div className="response" id="mce-success-response" style={{display:'none'}} />
//           </div>
//           <div style={{position: 'absolute', left: '-5000px'}} aria-hidden="true">
//             <input type="text" name="b_2d338b2589df4f1d3cf5e6c2a_3ffe2cc5fa" tabIndex="-1" value="" />
//           </div>
//           <div className="input-group-button">
//             <input type="submit" value="Submit" name="subscribe" id="mc-embedded-subscribe" className="button" />
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// }

function FooterSocial() {
  return (
    <ul className="FooterSocial nav">
      <li className="nav-item">
        <ExternalLink className="nav-link pr-2 telegram-icon" url="https://t.me/zenprotocol/">
          <i className="fab fa-telegram-plane" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink className="nav-link px-2 github-icon" url="https://github.com/zenprotocol">
          <i className="fab fa-github" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink className="nav-link px-2 medium-icon" url="https://blog.zenprotocol.com/">
          <i className="fab fa-medium-m" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink className="nav-link px-2 twitter-icon" url="https://twitter.com/zen_protocol">
          <i className="fab fa-twitter" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink
          className="nav-link px-2 youtube-icon"
          url="https://www.youtube.com/channel/UCVm4j3TrmD8mSvvExG_CAIw"
        >
          <i className="fab fa-youtube" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink className="nav-link pl-2 discourse-icon" url="https://forum.zenprotocol.com">
          <i className="fab fa-discourse" />
        </ExternalLink>
      </li>
    </ul>
  );
}

function FooterCopyright() {
  return (
    <ul className="nav flex-column">
      <li className="nav-item text-nowrap">
        <div className="copyright nav-link">
          <span>{`© ${new Date().getFullYear()}`} Blockchain Development LTD.</span>
        </div>
      </li>
    </ul>
  );
}
