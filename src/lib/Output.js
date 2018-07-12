export default {
  getTextByLockType(lockType) {
    switch (lockType.toLowerCase()) {
      case 'destroy':
        return 'Destroyed';
      default:
        return lockType;
    }
  }
};