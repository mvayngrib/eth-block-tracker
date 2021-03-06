'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const EthQuery = require('ethjs-query')
var EthQuery = require('eth-query');
var AsyncEventEmitter = require('async-eventemitter');
var pify = require('pify');
var hexUtils = require('./hexUtils');
var incrementHexNumber = hexUtils.incrementHexNumber;

var RpcBlockTracker = function (_AsyncEventEmitter) {
  (0, _inherits3.default)(RpcBlockTracker, _AsyncEventEmitter);

  function RpcBlockTracker() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, RpcBlockTracker);

    var _this = (0, _possibleConstructorReturn3.default)(this, (RpcBlockTracker.__proto__ || (0, _getPrototypeOf2.default)(RpcBlockTracker)).call(this));

    if (!opts.provider) throw new Error('RpcBlockTracker - no provider specified.');
    _this._query = new EthQuery(opts.provider);
    // config
    _this._pollingInterval = opts.pollingInterval || 4e3; // 4 sec
    _this._syncingTimeout = opts.syncingTimeout || 60 * 1e3; // 1 min
    // state
    _this._trackingBlock = null;
    _this._trackingBlockTimestamp = null;
    _this._currentBlock = null;
    _this._isRunning = false;
    // bind methods for cleaner syntax later
    _this.emit = _this.emit.bind(_this);
    _this._performSync = _this._performSync.bind(_this);
    return _this;
  }

  (0, _createClass3.default)(RpcBlockTracker, [{
    key: 'getTrackingBlock',
    value: function getTrackingBlock() {
      return this._trackingBlock;
    }
  }, {
    key: 'getCurrentBlock',
    value: function getCurrentBlock() {
      return this._currentBlock;
    }
  }, {
    key: 'awaitCurrentBlock',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var _this2 = this;

        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this._currentBlock) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', this._currentBlock);

              case 2:
                _context.next = 4;
                return new _promise2.default(function (resolve) {
                  return _this2.once('sync', resolve);
                });

              case 4:
                return _context.abrupt('return', this._currentBlock);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function awaitCurrentBlock() {
        return _ref.apply(this, arguments);
      }

      return awaitCurrentBlock;
    }()
  }, {
    key: 'start',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this._isRunning) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return');

              case 2:
                this._isRunning = true;
                // if this._currentBlock

                if (!opts.fromBlock) {
                  _context2.next = 12;
                  break;
                }

                _context2.t0 = this;
                _context2.next = 7;
                return this._fetchBlockByNumber(opts.fromBlock);

              case 7:
                _context2.t1 = _context2.sent;
                _context2.next = 10;
                return _context2.t0._setTrackingBlock.call(_context2.t0, _context2.t1);

              case 10:
                _context2.next = 18;
                break;

              case 12:
                _context2.t2 = this;
                _context2.next = 15;
                return this._fetchLatestBlock();

              case 15:
                _context2.t3 = _context2.sent;
                _context2.next = 18;
                return _context2.t2._setTrackingBlock.call(_context2.t2, _context2.t3);

              case 18:
                this._performSync().catch(function (err) {
                  if (err) console.error(err);
                });

              case 19:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function start() {
        return _ref2.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'stop',
    value: function stop() {
      this._isRunning = false;
    }

    //
    // private
    //

  }, {
    key: '_setTrackingBlock',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(newBlock) {
        var previous, now;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(this._trackingBlock && this._trackingBlock.hash === newBlock.hash)) {
                  _context3.next = 2;
                  break;
                }

                return _context3.abrupt('return');

              case 2:
                // check for large timestamp lapse
                previous = this._trackingBlockTimestamp;
                now = Date.now();
                // check for desynchronization (computer sleep or no internet)

                if (!(previous && now - previous > this._syncingTimeout)) {
                  _context3.next = 10;
                  break;
                }

                this._trackingBlockTimestamp = null;
                _context3.next = 8;
                return this._warpToLatest();

              case 8:
                _context3.next = 14;
                break;

              case 10:
                this._trackingBlock = newBlock;
                this._trackingBlockTimestamp = now;
                _context3.next = 14;
                return pify(this.emit)('block', newBlock);

              case 14:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _setTrackingBlock(_x3) {
        return _ref3.apply(this, arguments);
      }

      return _setTrackingBlock;
    }()
  }, {
    key: '_setCurrentBlock',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(newBlock) {
        var oldBlock;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(this._currentBlock && this._currentBlock.hash === newBlock.hash)) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt('return');

              case 2:
                oldBlock = this._currentBlock;

                this._currentBlock = newBlock;
                _context4.next = 6;
                return pify(this.emit)('latest', newBlock);

              case 6:
                _context4.next = 8;
                return pify(this.emit)('sync', { newBlock: newBlock, oldBlock: oldBlock });

              case 8:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _setCurrentBlock(_x4) {
        return _ref4.apply(this, arguments);
      }

      return _setCurrentBlock;
    }()
  }, {
    key: '_warpToLatest',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.t0 = this;
                _context5.next = 3;
                return this._fetchLatestBlock();

              case 3:
                _context5.t1 = _context5.sent;
                _context5.next = 6;
                return _context5.t0._setTrackingBlock.call(_context5.t0, _context5.t1);

              case 6:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _warpToLatest() {
        return _ref5.apply(this, arguments);
      }

      return _warpToLatest;
    }()
  }, {
    key: '_pollForNextBlock',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
        var _this3 = this;

        var timeout;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                timeout = setTimeout(function () {
                  return _this3._performSync();
                }, this._pollingInterval);

                if (timeout.unref) timeout.unref();

              case 2:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function _pollForNextBlock() {
        return _ref6.apply(this, arguments);
      }

      return _pollForNextBlock;
    }()
  }, {
    key: '_performSync',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
        var trackingBlock, nextNumber, newBlock;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (this._isRunning) {
                  _context7.next = 2;
                  break;
                }

                return _context7.abrupt('return');

              case 2:
                trackingBlock = this.getTrackingBlock();

                if (trackingBlock) {
                  _context7.next = 5;
                  break;
                }

                throw new Error('RpcBlockTracker - tracking block is missing');

              case 5:
                nextNumber = incrementHexNumber(trackingBlock.number);
                _context7.prev = 6;
                _context7.next = 9;
                return this._fetchBlockByNumber(nextNumber);

              case 9:
                newBlock = _context7.sent;

                if (!newBlock) {
                  _context7.next = 16;
                  break;
                }

                _context7.next = 13;
                return this._setTrackingBlock(newBlock);

              case 13:
                // ask for next block
                this._performSync();
                _context7.next = 19;
                break;

              case 16:
                _context7.next = 18;
                return this._setCurrentBlock(trackingBlock);

              case 18:
                // setup poll for next block
                this._pollForNextBlock();

              case 19:
                _context7.next = 31;
                break;

              case 21:
                _context7.prev = 21;
                _context7.t0 = _context7['catch'](6);

                if (!(_context7.t0.message.includes('index out of range') || _context7.t0.message.includes("Couldn't find block by reference"))) {
                  _context7.next = 29;
                  break;
                }

                _context7.next = 26;
                return this._setCurrentBlock(trackingBlock);

              case 26:
                // setup poll for next block
                this._pollForNextBlock();
                _context7.next = 31;
                break;

              case 29:
                console.error(_context7.t0);
                this._pollForNextBlock();

              case 31:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this, [[6, 21]]);
      }));

      function _performSync() {
        return _ref7.apply(this, arguments);
      }

      return _performSync;
    }()
  }, {
    key: '_fetchLatestBlock',
    value: function _fetchLatestBlock() {
      return pify(this._query.getBlockByNumber).call(this._query, 'latest', true);
    }
  }, {
    key: '_fetchBlockByNumber',
    value: function _fetchBlockByNumber(hexNumber) {
      var cleanHex = hexUtils.formatHex(hexNumber);
      return pify(this._query.getBlockByNumber).call(this._query, cleanHex, true);
    }
  }]);
  return RpcBlockTracker;
}(AsyncEventEmitter);

module.exports = RpcBlockTracker;

// ├─ difficulty: 0x2892ddca
// ├─ extraData: 0xd983010507846765746887676f312e372e348777696e646f7773
// ├─ gasLimit: 0x47e7c4
// ├─ gasUsed: 0x6384
// ├─ hash: 0xf60903687b1559b9c80f2d935b4c4f468ad95c3076928c432ec34f2ef3d4eec9
// ├─ logsBloom: 0x00000000000000000000000000000000000000000000000000000000000020000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000
// ├─ miner: 0x01711853335f857442ef6f349b2467c531731318
// ├─ mixHash: 0xf0d9bec999600eec92e8e4da8fc1182e357468c9ed2f849aa17e0e900412b352
// ├─ nonce: 0xd556d5a5504198e4
// ├─ number: 0x72ac8
// ├─ parentHash: 0xf5239c3ce1085194521435a5052494c02bbb1002b019684dcf368490ea6208e5
// ├─ receiptsRoot: 0x78c6f8236094b392bcc43b47b0dc1ce93ecd2875bfb5e4e4c3431e5af698ff99
// ├─ sha3Uncles: 0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347
// ├─ size: 0x2ad
// ├─ stateRoot: 0x0554f145c481df2fa02ecd2da17071672740c3aa948c896f1465e6772f741ac6
// ├─ timestamp: 0x58955844
// ├─ totalDifficulty: 0x751d0dfa03c1
// ├─ transactions
// │  └─ 0
// │     ├─ blockHash: 0xf60903687b1559b9c80f2d935b4c4f468ad95c3076928c432ec34f2ef3d4eec9
// │     ├─ blockNumber: 0x72ac8
// │     ├─ from: 0x201354729f8d0f8b64e9a0c353c672c6a66b3857
// │     ├─ gas: 0x15f90
// │     ├─ gasPrice: 0x4a817c800
// │     ├─ hash: 0xd5a15d7c2449150db4f74f42a6ca0702150a24c46c5b406a7e1b3e44908ef44d
// │     ├─ input: 0xe1fa8e849bc10d87fb03c6b0603b05a3e29043c7e0b7c927119576a4bec457e96c7d7cde
// │     ├─ nonce: 0x323e
// │     ├─ to: 0xd10e3be2bc8f959bc8c41cf65f60de721cf89adf
// │     ├─ transactionIndex: 0x0
// │     ├─ value: 0x0
// │     ├─ v: 0x29
// │     ├─ r: 0xf35f8ab241e6bb3ccaffd21b268dbfc7fcb5df1c1fb83ee5306207e4a1a3e954
// │     └─ s: 0x1610cdac2782c91065fd43584cd8974f7f3b4e6d46a2aafe7b101788285bf3f2
// ├─ transactionsRoot: 0xb090c32d840dec1e9752719f21bbae4a73e58333aecb89bc3b8ed559fb2712a3
// └─ uncles