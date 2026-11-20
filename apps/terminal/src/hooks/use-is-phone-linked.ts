import { useConnection } from "wagmi";
import { PHONE_LINK_CONNECTOR_ID } from "@/lib/phone-link/connector";

export function useIsPhoneLinked(): boolean {
	return useConnection().connector?.id === PHONE_LINK_CONNECTOR_ID;
}
