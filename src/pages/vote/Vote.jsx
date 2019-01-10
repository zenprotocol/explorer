import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import HashLink from '../../components/HashLink';
import './Vote.scss';

export default function Vote(props) {
  const voteInProgress = true;
  return (
    <Page className="Vote">
      <Helmet>
        <title>{TextUtils.getHtmlTitle('Vote')}</title>
      </Helmet>
      <section>
        <PageTitle title="VOTE on the authorized protocol " />
        <div className="row">
          <div className="col-lg-6">
            <div>
              <TopTable voteInProgress={voteInProgress} />
            </div>
            <div className="votes-container">
              {voteInProgress ? <Scores votes={
                [
                  {
                    address: 'zen1q03jc77dtd2x2gk90f40p9ezv5pf3e2wm5hy8me2xuxzmjneachrq6g05w5',
                    score: 1000
                  },
                  {
                    address: 'zen1qjllcrp3u24derxfx9w5s7h5h0c2ggwqfs3p3x6t75xe8fqulh95skq746g',
                    score: 900
                  },
                  {
                    address: 'zen1q05xwuujk79l30qdgydp95d0dpqaqqe6scpx3q2xz5d9e2c4xj0nqntug7z',
                    score: 900
                  },
                  {
                    address: 'zen1qqe3ytnf6572c3tvmnudejavf0rjelcj7uvcwncevav3gt4a44pvsldr876',
                    score: 400
                  },
                  {
                    address: 'zen1qa9ttmrt43l9h5h7fdllk3lx5j090yc7lm42226nt63f4jd2rksnqa4s0gv',
                    score: 200
                  },
                ]
              } /> : <VoteNoteStartedMsg />}
              
            </div>
          </div>
          <div className="col-lg-6 description">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer eget porta nisl.
            Integer at blandit erat, tempor tincidunt turpis. Phasellus luctus posuere arcu, id
            dictum dui mattis sagittis. Nullam nec bibendum risus. Nunc vitae commodo tellus, non
            rutrum leo. Aliquam aliquet lacus nec iaculis dignissim. Cras molestie ornare vehicula.
            Praesent turpis Nullam nec bibendum risus. Nunc vitae commodo tellus, non rutrum leo.
            Aliquam aliquet lacus nec iaculis dignissim. Cras molestie ornare vehicula. Praesent
            turpis Nullam nec bibendum risus. Nunc vitae commodo tellus, non rutrum leo. Aliquam
            aliquet lacus nec iaculis dignissim. Cras molestie ornare vehicula. Praesent turpis
            Nullam nec bibendum risus. Nunc vitae commodo tellus, non rutrum leo. Aliquam aliquet
            lacus nec iaculis dignissim.
          </div>
        </div>
      </section>
    </Page>
  );
}

function TopTable({ store, voteInProgress }) {
  const currentBlock = 9000;
  const startBlock = 9500;
  const endBlock = 10000;
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

function VoteNoteStartedMsg() {
  return <div className="VoteNoteStartedMsg text-center">VOTE AFTER SNAPSHOT</div>;
}

function Scores({ votes }) {
  return (
    <table className="table table-zen">
      <thead>
        <tr>
          <th scope="col">Received Address</th>
          <th scope="col" className="text-right"># Votes</th>
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
