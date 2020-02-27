import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import TextUtils from '../../lib/TextUtils';

const PAGES_TO_SHOW = 4;
const MIN_PAGE_SKIP = 10;
const PAGE_SKIP_MULTIPLIER = 2;

export default class ReactTablePagination extends Component {
  constructor(props) {
    super(props);

    // multiplied after each sequential click
    this.state = {
      skipUp: MIN_PAGE_SKIP,
      skipDown: MIN_PAGE_SKIP,
    };

    this.getSafePage = this.getSafePage.bind(this);
    this.changePage = this.changePage.bind(this);
  }

  getSafePage(page) {
    if (Number.isNaN(page)) {
      page = this.props.page;
    }
    return Math.min(Math.max(page, 0), this.props.pages - 1);
  }

  changePage(page) {
    page = this.getSafePage(page);
    if (this.props.page !== page) {
      this.props.onPageChange(page);
    }
    this.calculateNextPageSkips(page);
  }

  calculateNextPageSkips(page) {
    if (
      [0, this.props.pages - 1].includes(page) ||
      Math.abs(page - this.props.page) < MIN_PAGE_SKIP
    ) {
      // reset
      this.setState({
        skipUp: MIN_PAGE_SKIP,
        skipDown: MIN_PAGE_SKIP,
      });
    } else {
      // multiply
      if (page > this.props.page) {
        this.setState(state => ({
          skipUp: state.skipUp * PAGE_SKIP_MULTIPLIER,
          skipDown: MIN_PAGE_SKIP,
        }));
      } else {
        this.setState(state => ({
          skipUp: MIN_PAGE_SKIP,
          skipDown: state.skipDown * PAGE_SKIP_MULTIPLIER,
        }));
      }
    }
  }

  render() {
    const {
      // Computed
      pages,
      // Props
      page,
      canPrevious,
      canNext,
      className,
    } = this.props;

    if (pages < 2) {
      return null;
    }

    return (
      <div className={classnames(className, '-pagination')} style={this.props.style}>
        <nav aria-label="Page navigation">
          <ul className="pagination pagination-sm">
            <li className="page-item page-skip-first">
              <button
                className="page-link"
                onClick={() => {
                  this.changePage(0);
                }}
                disabled={!canPrevious}
              >
                {this.props.firstText}
              </button>
            </li>
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => {
                  if (!canPrevious) return;
                  this.changePage(page - 1);
                }}
                disabled={!canPrevious}
              >
                {this.props.previousText}
              </button>
            </li>
            {this.getPageButtons(page, pages)}
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => {
                  if (!canNext) return;
                  this.changePage(page + 1);
                }}
                disabled={!canNext}
              >
                {this.props.nextText}
              </button>
            </li>
            <li className="page-item page-skip-last">
              <button
                className="page-link"
                onClick={() => {
                  this.changePage(pages - 1);
                }}
                disabled={!canNext}
              >
                {this.props.lastText}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  }

  getPageButtons(page, pages) {
    const pageButtonsNumbers = [];

    for (let i = 0; i < pages; i++) {
      if (
        i === 0 ||
        (i < PAGES_TO_SHOW && page < 2) ||
        (Math.abs(page - i) < PAGES_TO_SHOW - 2 && page >= 2) ||
        (i >= pages - PAGES_TO_SHOW && page >= pages - 2) ||
        i === pages - 1
      ) {
        pageButtonsNumbers.push(i);
      }
    }
    const pageButtons = [];
    for (let i = 0; i < pageButtonsNumbers.length; i++) {
      const curPageNumber = pageButtonsNumbers[i];
      pageButtons.push(
        this.getPageButton({
          page: curPageNumber,
          active: curPageNumber === page,
          classNames: 'page-number',
        })
      );
      if (i < pageButtonsNumbers.length - 1) {
        const nextPageNumber = pageButtonsNumbers[i + 1];
        if (nextPageNumber - curPageNumber > 1) {
          const skipHalf = Math.floor((nextPageNumber + curPageNumber) / 2);
          const skipToPage =
            page < curPageNumber
              ? Math.min(curPageNumber + this.state.skipUp, skipHalf)
              : Math.max(nextPageNumber - this.state.skipDown, skipHalf);
              
          pageButtons.push(
            this.getPageButton({
              page: skipToPage,
              active: false,
              text: '...',
              key: curPageNumber + pages,
              classNames: 'page-skip',
            })
          );
        }
      }
    }

    return pageButtons;
  }

  getPageButton({ page, active, text, key, classNames } = {}) {
    return (
      <li key={key || page} className={classnames('page-item', { active }, classNames)}>
        <button
          onClick={() => {
            this.changePage(page);
          }}
          className="page-link"
        >
          {text || TextUtils.formatNumber(page + 1)}
        </button>
      </li>
    );
  }
}

ReactTablePagination.propTypes = {
  pages: PropTypes.number,
  page: PropTypes.number,
  canPrevious: PropTypes.bool,
  canNext: PropTypes.bool,
  className: PropTypes.string,
  firstText: PropTypes.any,
  lastText: PropTypes.any,
  nextText: PropTypes.any,
  previousText: PropTypes.any,
  style: PropTypes.any,
};
