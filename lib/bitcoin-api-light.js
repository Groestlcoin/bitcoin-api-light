"use strict"

const axios = require('axios')
const c     = console

let LOG = false

const enableLogging = () => {
  LOG = true
}

const balanceUrl = (address, confirmations) => {
  return `http://blockchain.info/q/addressbalance/${address}?confirmations=${confirmations}`
}

const unspentUrl = (address) => {
  return `https://blockchain.info/unspent?active=${address}`
}

const pushTXUrl  = "https://api.blockcypher.com/v1/btc/main/txs/push"


const getBalance = (address, confirmations = 1) => {
  let url = balanceUrl(address, confirmations)
  // c.log(url)
  return axios.get(url)
    .then((resp) => {
      let balance = Number(resp.data)
      if (!balance) return Promise.reject()
      if (LOG)      c.log(`Balance of '${address}' at 0 confirmations:`, balance)
      return Promise.resolve(balance)
    })
    .catch((resp) => {
      let error = resp.data.error
      c.error(`Bitcoin-API-light - Error during getBalance, response from Blockchain.info API:`, error)
      return Promise.reject(error)
    })
}

const getUTXOs = (address) => {
  let url = unspentUrl(address)
  return axios.get(url)
    .then((resp) => {
      var utxos = []
      var outputs = resp.data.unspent_outputs
      outputs.forEach((output) => {
        utxos.push({
          tx_hash:  output.tx_hash_big_endian,
          output_n: output.tx_output_n,
          script:   output.script,
          value:    output.value,
        })
      })
      if (LOG) c.log(`UTXOs for address '${address}':\n`, utxos)
      return Promise.resolve(utxos)
    })
    .catch((resp) => {
      let error = resp.data.error
      c.error(`Bitcoin-API-light - Error during getUTXOs, response from Blockcypher API:`, error)
      return Promise.reject(error)
    })
}

const pushTX = (rawTX) => {
  let tx = { tx: rawTX }
  return axios.post(pushTXUrl, {
      data: tx,
    })
    .then((resp) => {
        var txHash = resp.data.tx.hash
        c.log(`Transaction sent!\nTx hash:`, txHash, `\nSee the transaction on Blockcypher's block explorer: https://live.blockcypher.com/btc/tx/${txHash}`)
        return Promise.resolve(txHash)
    })
    .catch((resp) => {
      let error = resp.data.error
      c.error("Bitcoin-API-light - Error during pushTX, response from Blockcypher API:", error)
      return Promise.reject(error)
    })
}


module.exports = {
  getBalance:     getBalance,
  getUTXOs:       getUTXOs,
  pushTX:         pushTX,
  enableLogging:  enableLogging,
}