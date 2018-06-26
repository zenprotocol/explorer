import React, { Component } from 'react';
import classnames from 'classnames';

const PAGES_TO_SHOW = 4;

export default class ReactTablePagination extends Component {
  constructor(props) {
    super();

    this.getSafePage = this.getSafePage.bind(this);
    this.changePage = this.changePage.bind(this);
    this.applyPage = this.applyPage.bind(this);

    this.state = {
      page: props.page,
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ page: nextProps.page });
  }

  getSafePage(page) {
    if (Number.isNaN(page)) {
      page = this.props.page;
    }
    return Math.min(Math.max(page, 0), this.props.pages - 1);
  }

  changePage(page) {
    page = this.getSafePage(page);
    this.setState({ page });
    if (this.props.page !== page) {
      this.props.onPageChange(page);
    }
  }

  applyPage(e) {
    if (e) {
      e.preventDefault();
    }
    const page = this.state.page;
    this.changePage(page === '' ? this.props.page : page);
  }

  render() {
    const {
      // Computed
      pages,
      // Props
      page,
      showPageSizeOptions,
      pageSizeOptions,
      pageSize,
      showPageJump,
      canPrevious,
      canNext,
      onPageSizeChange,
      className,
    } = this.props;
    
    return (
      <div className={classnames(className, '-pagination')} style={this.props.style}>
        <nav aria-label="Page navigation">
          <ul className="pagination pagination-sm">
            <li className="page-item">
              <a
                className="page-link"
                onClick={() => {
                  if (!canPrevious) return;
                  this.changePage(page - 1);
                }}
                disabled={!canPrevious}
              >
                {this.props.previousText}
              </a>
            </li>
            {this.getPageButtons(page, pages)}
            <li className="page-item">
              <a
                className="page-link"
                onClick={() => {
                  if (!canNext) return;
                  this.changePage(page + 1);
                }}
                disabled={!canNext}
              >
                {this.props.nextText}
              </a>
            </li>
          </ul>
        </nav>
        {/* <div className="-center">
          <span className="-pageInfo">
            {this.props.pageText}{' '}
            {showPageJump ? (
              <div className="-pageJump">
                <input
                  type={this.state.page === '' ? 'text' : 'number'}
                  onChange={e => {
                    const val = e.target.value
                    const page = val - 1
                    if (val === '') {
                      return this.setState({ page: val })
                    }
                    this.setState({ page: this.getSafePage(page) })
                  }}
                  value={this.state.page === '' ? '' : this.state.page + 1}
                  onBlur={this.applyPage}
                  onKeyPress={e => {
                    if (e.which === 13 || e.keyCode === 13) {
                      this.applyPage()
                    }
                  }}
                />
              </div>
            ) : (
              <span className="-currentPage">{page + 1}</span>
            )}{' '}
            {this.props.ofText} <span className="-totalPages">{pages || 1}</span>
          </span>
        </div> */}
      </div>
    );
  }

  getPageButton(page, active, text, key) {
    return (
      <li key={key || page} className={classnames('page-item', { active })}>
        <a
          onClick={() => {
            this.changePage(page);
          }}
          className="page-link"
        >
          {text || page + 1}
        </a>
      </li>
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
      pageButtons.push(this.getPageButton(curPageNumber, curPageNumber === page));
      if(i < pageButtonsNumbers.length - 1) {
        const nextPageNumber = pageButtonsNumbers[i + 1];
        if (nextPageNumber - curPageNumber > 1) {
          pageButtons.push(this.getPageButton(Math.floor((nextPageNumber + curPageNumber) / 2), false, '...', curPageNumber + pages));
        }
      }
    }

    return pageButtons;
  }
}
