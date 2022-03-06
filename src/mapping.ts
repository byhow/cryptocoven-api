import {
  Transfer as TransferEvent,
} from '../generated/Token/Token'
import { ipfs, json } from '@graphprotocol/graph-ts';
import { Token, User } from '../generated/schema';

const ipfsHash = "QmZHKZDavkvNfA9gSAg7HALv8jF7BJaKjUc9U2LSuvUySB";

export function handleTransfer(event: TransferEvent): void {
  let token = Token.load(event.params.tokenId.toString());

  if (!token) {
    // create the token if not existed
    token = new Token(event.params.tokenId.toString());
    token.tokenID = event.params.tokenId;
    token.updatedAtTimestamp = event.block.timestamp;
    token.tokenURI = `/${event.params.tokenId.toString()}.json`;

    // construct ipfs request
    let metadata = ipfs.cat(`${ipfsHash}${token.tokenURI}`);
    if (metadata) {
      const val = json.fromBytes(metadata).toObject();
      if (val) {
        // populate the token object with ipfs metadata
        const img = val.get('image');
        const name = val.get('name');
        const description = val.get('description');
        const externalURL = val.get('external_url');

        if (name && img && description && externalURL) {
          token.name = name.toString();
          token.image = img.toString();
          token.externalURL = externalURL.toString();
          token.ipfsURI = `ipfs.io/ipfs/${ipfsHash}/${token.tokenURI}`;
        }

        const coven = val.get('coven');
        if (coven) {
          const covenObj = coven.toObject();
          const type = covenObj.get('type');
          if (type) {
            token.type = type.toString();
          }

          const birthChart = covenObj.get('birthChart');
          if (birthChart) {
            const chartObj = birthChart.toObject();
            const sun = chartObj.get('sun');
            const moon = chartObj.get('moon');
            const rising = chartObj.get('rising');

            if (sun && moon && rising) {
              token.sun = sun.toString();
              token.moon = moon.toString();
              token.rising = rising.toString();
            }
          }
        }
      }
    }
  }

  // update the fields to the graph node
  token.owner = event.params.to.toHexString();
  token.save();

  // create user if not exist
  let user = User.load(event.params.to.toHexString());
  if (!user) {
    user = new User(event.params.to.toHexString());
    user.save();
  }
}
