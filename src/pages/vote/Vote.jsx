import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import Service from '../../lib/Service';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import HashLink from '../../components/HashLink';
import './Vote.scss';

export default class Vote extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      vote: null,
    };
  }
  componentDidMount() {
    Service.votes.findCurrentOrNext().then(result => {
      this.setState({ vote: result.data });
    });
  }
  render() {
    const voteInProgress = true;
    const { vote } = this.state;
    if (!vote) {
      return null;
    }

    return (
      <Page className="Vote">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Vote')}</title>
        </Helmet>
        <section>
          <PageTitle title={vote.title} />
          <div className="row">
            <div className="col-lg-6">
              <div>
                <TopTable vote={vote} voteInProgress={voteInProgress} />
              </div>
              <div className="votes-container">
                {voteInProgress ? <Scores votes={vote.votes} /> : <VoteNoteStartedMsg />}
              </div>
            </div>
            <div className="col-lg-6 description">{vote.description}</div>
          </div>
        </section>
      </Page>
    );
  }
}

function TopTable({ vote, voteInProgress }) {
  const currentBlock = 9000;
  const { startBlock, endBlock } = vote;
  return (
    <table className="table table-zen">
      <thead>
        <tr>
          <th scope="col" colSpan="2">
            {voteInProgress ? 'SUMMARY' : 'NEXT VOTE'}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>CURRENT BLOCK</td>
          <td className="text-right">
            <Link to={`/blocks/${currentBlock}`}>{currentBlock}</Link>
          </td>
        </tr>
        <tr>
          <td>NEXT SNAPSHOT BLOCK</td>
          <td className="text-right">
            <Link to={`/blocks/${startBlock}`}>{startBlock}</Link>
          </td>
        </tr>
        <tr>
          <td>TALLY BLOCK</td>
          <td className="text-right">
            <Link to={`/blocks/${endBlock}`}>{endBlock}</Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
TopTable.propTypes = {
  vote: PropTypes.object,
  voteInProgress: PropTypes.bool,
};

function VoteNoteStartedMsg() {
  return <div className="VoteNoteStartedMsg text-center">VOTE AFTER SNAPSHOT</div>;
}

function Scores({ votes }) {
  return (
    <table className="table table-zen">
      <thead>
        <tr>
          <th scope="col">Received Address</th>
          <th scope="col" className="text-right">
            # Votes
          </th>
        </tr>
      </thead>
      <tbody>
        {votes.map(vote => (
          <tr key={vote.address}>
            <td>
              <HashLink url={`/address/${vote.address}`} hash={vote.address} />
            </td>
            <td className="text-right">{vote.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
Scores.propTypes = {
  votes: PropTypes.array,
};
