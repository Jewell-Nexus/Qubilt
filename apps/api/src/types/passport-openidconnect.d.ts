declare module 'passport-openidconnect' {
  import { Strategy as PassportStrategy } from 'passport';

  interface StrategyOptions {
    issuer: string;
    authorizationURL: string;
    tokenURL: string;
    userInfoURL: string;
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    passReqToCallback?: boolean;
  }

  class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: Function);
  }

  export { Strategy };
}
