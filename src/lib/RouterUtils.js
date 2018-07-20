export default {
  getRouteParams(props) {
    const {
      match: { params },
    } = props;

    return params || {};
  }
};