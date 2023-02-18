import { useTimeoutTooltip } from "../Ninja/hooks/use-timeout-tooltip";
import { TooltipKey } from "../Ninja/tooltip.enum";

const Socket = ({
  pubkey,
  socket,
  isPaired,
  hasChannel,
  refetchPeers,
}: {
  pubkey: string;
  socket: string;
  isPaired: boolean;
  hasChannel: boolean;
  refetchPeers: () => void;
}) => {
  const setTooltip = useTimeoutTooltip();

  const ipAndPortRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):(6553[0-5]|655[0-2][0-9]|65[0-4][0-9][0-9]|6[0-4][0-9][0-9][0-9][0-9]|[1-5](\d){4}|[1-9](\d){0,3})$/;

  if (!socket.includes("onion") && !socket.match(ipAndPortRegex)) {
    return null;
  }

  const text = socket.includes("onion")
    ? "copy TOR address"
    : "copy clearnet address";

  const address = `${pubkey}@${socket}`;

  const handleClick = async () => {
    await navigator.clipboard.writeText(address);

    setTooltip(TooltipKey.ADDRESS_CLICKED);
  };

  const handleConnectPeerWebLN = async () => {
    if (window.webln) {
      try {
        await window.webln.enable();
        await window.webln.request("connectpeer", {
          addr: { pubkey, host: socket },
          perm: true,
          timeout: 10,
        });
        refetchPeers();
      } catch (error) {
        alert("ConnectPeer failed: " + (error as Error).message);
      }
    }
  };
  const handleCreateChannelWebLN = async () => {
    function hexToBase64(hexstring: string) {
      return btoa(
        hexstring
          .match(/\w{2}/g)!
          .map(function (a) {
            return String.fromCharCode(parseInt(a, 16));
          })
          .join("")
      );
    }

    if (window.webln) {
      try {
        await window.webln.enable();
        const result = await window.webln.request("openchannel", {
          node_pubkey: hexToBase64(pubkey),
          local_funding_amount: 20000, // in sats
          push_sat: 0,
        });
        alert("Channel created: " + JSON.stringify(result));

        //refetchPeers();
      } catch (error) {
        alert("CreateChannel failed: " + (error as Error).message);
      }
    }
  };
  const handleDisconnectPeerWebLN = async () => {
    try {
      if (window.webln) {
        await window.webln.enable();
        await window.webln.request("disconnectpeer", {
          pub_key: pubkey,
        });
        refetchPeers();
      }
    } catch (error) {
      alert("DisconnectPeer failed: " + (error as Error).message);
    }
  };

  return (
    <>
      <button className="socket__button" onClick={handleClick}>
        {text}
      </button>
      {!isPaired ? (
        <button className="socket__button" onClick={handleConnectPeerWebLN}>
          Peer (WebLN)
        </button>
      ) : (
        <>
          {hasChannel ? (
            <button className="socket__button">Channel Open!</button>
          ) : (
            <button
              className="socket__button"
              onClick={handleCreateChannelWebLN}
            >
              Open Channel (WebLN)
            </button>
          )}

          <button
            className="socket__button"
            onClick={handleDisconnectPeerWebLN}
          >
            Disconnect (WebLN)
          </button>
        </>
      )}
    </>
  );
};

export default Socket;
