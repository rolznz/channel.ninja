import React from "react";
import { useCallback, useEffect, useRef } from "react";
import Form from "../../components/Form";
import ListItem from "../../components/ListItem";
import Ninja from "../../components/Ninja";
import { useTimeoutTooltip } from "../../components/Ninja/hooks/use-timeout-tooltip";
import { TooltipKey } from "../../components/Ninja/tooltip.enum";
import Node from "../../components/Node";
import NodeInfo from "../../components/NodeInfo";
import Social from "../../components/Social";
import { useSockets } from "../../context/useSocket";
import { LndService, SuggestionsService } from "../../generated";
import {
  invoiceFetched,
  invoicePaid,
  nodeInfoChanged,
  nodesFetched,
  validPubKeyEntered,
} from "../../redux/global-slice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import "./home.css";

export enum TooltipState {
  INIT = "INIT",
  VALID_PUB_KEY_ENTERED = "VALID_PUB_KEY_ENTERED",
  INVALID_PUB_KEY_ENTERED = "INVALID_PUB_KEY_ENTERED",
  NINJA_HOVERED = "NINJA_HOVERED",
  NINJA_CLICKED = "NINJA_CLICKED",
}

export type Peer = {
  pub_key: string;
};
export type Channel = {
  remote_pubkey: string;
};

const HomePage = () => {
  const socket = useSockets();
  const state = useAppSelector((state) => state.global);
  const dispatch = useAppDispatch();
  const intervalRef = useRef<NodeJS.Timer>();
  const setTooltip = useTimeoutTooltip();
  const [peers, setPeers] = React.useState<Peer[]>([]);
  const refetchPeers = React.useCallback(async () => {
    if (window.webln) {
      await window.webln.enable();
      setPeers(
        ((await window.webln.request("listpeers")) as { peers: Peer[] }).peers
      );
    }
  }, []);
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const refetchChannels = React.useCallback(async () => {
    if (window.webln) {
      await window.webln.enable();
      setChannels(
        (
          (await window.webln.request("listchannels")) as {
            channels: Channel[];
          }
        ).channels
      );
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      await refetchPeers();
      await refetchChannels();
    })();
  }, [refetchPeers, refetchChannels]);

  useEffect(() => {
    socket?.on("lnd:invoice-confirmed", (id) => {
      if (process.env.NODE_ENV !== "production") {
        console.log(id, state.invoice);
      }

      if (id === state.invoice?.id) {
        dispatch(invoicePaid());
      }
    });

    if (state.invoice && !state.invoicePaid) {
      intervalRef.current = setInterval(() => {
        socket?.emit("lnd:check-invoice-status", { id: state.invoice?.id });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => {
      socket?.off("lnd:invoice-confirmed");
    };
  }, [state.invoice, dispatch, socket, state.invoicePaid]);

  const getInvoice = useCallback(async () => {
    try {
      const invoice = await LndService.createInvoice();
      if (invoice.isPaid) {
        dispatch(invoicePaid());
      } else {
        dispatch(invoiceFetched(invoice));
      }
    } catch (error) {
      console.error(error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!state.nodes) {
      return;
    }

    if (state.invoicePaid) {
      return;
    }

    if (!state.invoice) {
      if (process.env.NODE_ENV !== "production") {
        console.log("no invoice");
      }

      getInvoice();
    }
  }, [state.invoice, state.invoicePaid, state.nodes, getInvoice]);

  const fetchSuggestions = useCallback(
    async ({ pubKey }: { pubKey: string }) => {
      const response = await SuggestionsService.getSuggestions(pubKey);

      const nodes = response.map((node) => ({
        ...node,
        size: (node.channelCount * node.channelCount) / 2,
      }));

      dispatch(nodesFetched(nodes));
    },
    [dispatch]
  );

  const handleFormSubmit = useCallback(
    async ({ pubKey }: { pubKey: string }) => {
      try {
        const nodeInfo = await LndService.getNodeInfo(pubKey);

        if (!nodeInfo) {
          setTooltip(TooltipKey.INVALID_PUB_KEY);
          return;
        }

        dispatch(nodeInfoChanged(nodeInfo));
        dispatch(validPubKeyEntered(pubKey));
      } catch (error) {
        setTooltip(TooltipKey.INVALID_PUB_KEY);
        return;
      }

      try {
        if (pubKey) {
          await fetchSuggestions({ pubKey });
        }
      } catch (error) {
        setTooltip(TooltipKey.GRAPH_NOT_READY, 10000);
      }
    },
    [dispatch, setTooltip, fetchSuggestions]
  );

  return (
    <div className="home">
      <div className="home__ninja">
        <Ninja />
      </div>

      <div className="home__content">
        <div className="home__title">
          <h1>
            channel.ninja <span className="home__title--beta">(alpha)</span>
          </h1>
        </div>

        <div className="home__form">
          <Form onSubmit={handleFormSubmit} />
        </div>

        <div className="home__content-inner">
          {state.nodeInfo /*&& !state.invoicePaid*/ && state.pubKey && (
            <div className="home__node-info">
              <NodeInfo
                nodeInfo={state.nodeInfo}
                pubKey={state.pubKey}
                peers={peers}
                channels={channels}
              />
            </div>
          )}

          {state.invoicePaid && state.nodes && (
            <ul style={{ width: "100%" }}>
              {state.nodes.map((node) => (
                <ListItem key={node.id}>
                  <Node
                    node={node}
                    peers={peers}
                    refetchPeers={refetchPeers}
                    channels={channels}
                  />
                </ListItem>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Social />
    </div>
  );
};

export default HomePage;
