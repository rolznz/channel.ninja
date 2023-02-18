import React from "react";
import { NodeResponseDto } from "../../generated";
import { Channel, Peer } from "../../pages/HomePage/HomePage";
import { useAppDispatch } from "../../redux/hooks";
import Info from "../Info/Info";
import { connectionsMouseEntered, resetTooltip } from "../Ninja/tooltip-slice";
import "./node.css";
import Socket from "./Socket";

const Node = ({
  node,
  peers,
  channels,
  refetchPeers,
}: {
  node: NodeResponseDto;
  peers: Peer[];
  channels: Channel[];
  refetchPeers: () => void;
}) => {
  const dispatch = useAppDispatch();

  const handleConnectionsMouseEnter = () => {
    dispatch(connectionsMouseEntered());
  };

  const handleTooltipReset = () => {
    dispatch(resetTooltip());
  };

  return (
    <div id={node.id} className="node">
      <div className="node__headline-container">
        <a
          href={`https://amboss.space/node/${node.id}`}
          target="_blank"
          rel="noreferrer"
          className="node__link"
        >
          <h2 className="node__headline">{node.alias}</h2>
        </a>
      </div>

      <div className="node__meta-container">
        <div className="node__meta">
          <div className="node__meta-title">number of channels</div>
          <div className="node__meta-data">
            <span className="node__meta-data--bold">{node.channelCount}</span>{" "}
            channels
          </div>
        </div>

        <div className="node__meta">
          <div className="node__meta-title">distance</div>
          <div className="node__meta-data">
            <span className="node__meta-data--bold">{node.distance}</span> hops
          </div>
        </div>

        <div className="node__meta">
          <div className="node__meta-title">
            connections{" "}
            <Info
              onMouseEnter={handleConnectionsMouseEnter}
              onMouseLeave={handleTooltipReset}
            />
          </div>
          <div className="node__meta-data">
            <span className="node__meta-data--bold">{node.connections}</span>
          </div>
        </div>

        <div className="node__meta">
          <div className="node__meta-title">last updated</div>
          <div className="node__meta-data">
            <span className="node__meta-data--bold">
              {node.lastUpdate
                ? new Date(node.lastUpdate).toDateString()
                : "unknown"}
            </span>
          </div>
        </div>

        <div className="node__meta">
          <div className="node__meta-title">capacity</div>
          <div className="node__meta-data">
            <span className="node__meta-data--bold">
              {node.capacity?.toLocaleString("en-US") || "-"}
            </span>
            sats
          </div>
        </div>

        <div className="node__meta">
          <div className="node__meta-title">max channel size</div>
          <div className="node__meta-data">
            <span className="node__meta-data--bold">
              {node.maxChannelSize?.toLocaleString("en-US") || "-"}
            </span>
            sats
          </div>
        </div>

        <div className="node__meta">
          <div className="node__meta-title">min channel size</div>
          <div className="node__meta-data">
            <span className="node__meta-data--bold">
              {node.minChannelSize?.toLocaleString("en-US") || "-"}
            </span>
            sats
          </div>
        </div>

        <div className="node__meta">
          <div className="node__meta-title">avg channel size</div>
          <div className="node__meta-data">
            <span className="node__meta-data--bold">
              {node.avgChannelSize?.toLocaleString("en-US") || "-"}
            </span>
            sats
          </div>
        </div>
      </div>

      <div className="node__sockets-container">
        <ul className="node__sockets-list">
          {node.sockets.map((socket, i) => (
            <li key={i} className="node__sockets-list-item">
              <Socket
                socket={socket}
                pubkey={node.id}
                isPaired={peers.some((pair) => pair.pub_key === node.id)}
                hasChannel={channels.some(
                  (channel) => channel.remote_pubkey === node.id
                )}
                refetchPeers={refetchPeers}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Node;
