// from https://polaris.shopify.com/components/utilities/app-provider#using-linkcomponent
import { Link as ReactRouterLink } from "react-router";

const IS_EXTERNAL_LINK_REGEX = /^(?:[a-z][a-z\d+.-]*:|\/\/)/;

/**
 * @param { import("react").ComponentProps<NonNullable<import("@shopify/polaris").AppProviderProps["linkComponent"]>>} props
 */
export function AdaptorLink(props) {
  const { children, url = "", external, ref, ...rest } = props;

  if (external || IS_EXTERNAL_LINK_REGEX.test(url)) {
    rest.target = "_blank";
    rest.rel = "noopener noreferrer";
    return (
      <a href={url} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <ReactRouterLink to={url} {...rest}>
      {children}
    </ReactRouterLink>
  );
}
