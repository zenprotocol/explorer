import React from 'react';
import {observer} from 'mobx-react';
import blockStore from '../../store/BlockStore';
import Config from '../../lib/Config';
import Logo from '../Logo/Logo.jsx';
import './Footer.css';

export default function Footer(props) {
  return (
    <footer className="Footer">
      <div className="row">
        <div className="col-12">
          <Logo hideSubtitle={true} />
          <SyncNotification />
        </div>
      </div>
      <div className="row logo-padding">
        <div className="col-lg-7 border-secondary separator">
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

const SyncNotification = observer(function () {
  return (
    <div className="SyncNotification">
      {blockStore.syncing? (
        <span className="syncing">
          <i className="icon fa fa-spinner fa-spin"></i>{' '}
          Syncing...
        </span>
      ) : (
        <span className="synced">
          <i className="icon fas fa-circle"></i>{' '}
          Synced.
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
            <a
              className="nav-link text-nowrap"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.zenprotocol.com/deck/zen_protocol_deck_en.pdf"
            >
              Pitch Deck
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link text-nowrap"
              href="https://www.zenprotocol.com/files/zen_protocol_white_paper.pdf"
              target="_top"
            >
              White Paper
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link text-nowrap"
              href="https://www.zenprotocol.com/files/technical_paper.pdf"
              target="_top"
            >
              Technical Paper
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-nowrap" href="https://docs.zenprotocol.com/" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
          </li>
        </ul>
      </div>
      <div className="col-md-4">
        <ul className="nav flex-column">
          <li className="nav-item">
            <a
              className="nav-link text-nowrap"
              href="https://docs.zenprotocol.com/preparation/installers"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Wallet
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-nowrap" href="https://github.com/zenprotocol/ZFS-SDK" target="_blank" rel="noopener noreferrer">
              Developers SDK
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-nowrap" href="https://docs.zenprotocol.com/api" target="_blank" rel="noopener noreferrer">
              Developers API
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-nowrap" href="https://docs.zenprotocol.com/zen_js" target="_blank" rel="noopener noreferrer">
              Zen’s JS
            </a>
          </li>
        </ul>
      </div>
      <div className="col-md-4">
        <ul className="nav flex-column">
          <li className="nav-item">
            <a className="nav-link text-nowrap" target="_blank" rel="noopener noreferrer" href="http://blog.zenprotocol.com/">
              Blog
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-nowrap" href="https://forum.zenprotocol.com/" target="_blank" rel="noopener noreferrer">
              Forum
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-nowrap" href={`mailto:${Config.constants.zenInfoMail}`} target="_top">
              Contact Us
            </a>
          </li>
          <li className="nav-item text-nowrap">
            <a
              className="nav-link d-inline-block text-nowrap pr-0"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.zenprotocol.com/privacy?locale=en"
            >
              Privacy
            </a>
            <span> &amp; </span>
            <a
              href="https://www.zenprotocol.com/legal/zen_protocol_token_sale_agreement.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link text-nowrap d-inline-block pl-0"
            >
              Terms
            </a>
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
          <a className=" pl-0 d-inline-block" target="_blank" rel="noopener noreferrer" href={`mailto:${Config.constants.zenInfoMail}`}>
            {Config.constants.zenInfoMail}
          </a>
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
      <li className="nav-item"><a target="_blank" rel="noopener noreferrer" className="nav-link pr-2 telegram-icon" href="https://t.me/zenprotocol/"><i className="fab fa-telegram-plane"></i></a></li>
      <li className="nav-item"><a target="_blank" rel="noopener noreferrer" className="nav-link px-2 github-icon" href="https://github.com/zenprotocol"><i className="fab fa-github"></i></a></li>
      <li className="nav-item"><a target="_blank" rel="noopener noreferrer" className="nav-link px-2 medium-icon" href="https://blog.zenprotocol.com/"><i className="fab fa-medium-m"></i></a></li>
      <li className="nav-item"><a target="_blank" rel="noopener noreferrer" className="nav-link px-2 twitter-icon" href="https://twitter.com/zen_protocol"><i className="fab fa-twitter"></i></a></li>
      <li className="nav-item"><a target="_blank" rel="noopener noreferrer" className="nav-link px-2 youtube-icon" href="https://www.youtube.com/channel/UCVm4j3TrmD8mSvvExG_CAIw"><i className="fab fa-youtube"></i></a></li>
      <li className="nav-item"><a target="_blank" rel="noopener noreferrer" className="nav-link pl-2 discourse-icon" href="https://forum.zenprotocol.com"><i className="fab fa-discourse"></i></a></li>
    </ul>
  );
}

function FooterCopyright() {
  return (
    <ul className="nav flex-column">
      <li className="nav-item text-nowrap">
        <div className="copyright nav-link">
          <span>{`© ${(new Date()).getFullYear()}`} Blockchain Development LTD.</span>
        </div>
      </li>
    </ul>
    
  );
}