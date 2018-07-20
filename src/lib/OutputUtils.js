export default {
  getTextByLockType(lockType) {
    // you want to support more cases? 
    // if not, can do if/else
    switch (lockType.toLowerCase()) {
      case 'destroy':
        return 'Destroyed';
      default:
        return lockType;
    }
  }
};