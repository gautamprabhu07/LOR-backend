import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../users/user.model.js";
import { env } from "../../config/env.js";
import { BadRequestError } from "../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../core/errors/ForbiddenError.js";

export interface LoginPayload {
  userId: string;
  role: string;
}

export interface LoginResult {
  userId: string;
  role: string;
  accessToken: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      throw new BadRequestError("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new BadRequestError("Invalid credentials");
    }

    if (user.status !== "active") {
      throw new ForbiddenError("Account is not active");
    }

    const payload = {
      sub: user._id.toString(),
      role: user.role
    };

    const jwtSecret: string = env.JWT_ACCESS_SECRET;
    const jwtExpiresIn: string = env.JWT_ACCESS_EXPIRES_IN || "15m";

    const accessToken = jwt.sign(payload, jwtSecret, {
  expiresIn: jwtExpiresIn as Parameters<typeof jwt.sign>[2]["expiresIn"]
});


    return {
      userId: user._id.toString(),
      role: user.role,
      accessToken
    };
  },

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },

  decodeToken(token: string): LoginPayload {
    const jwtSecret: string = env.JWT_ACCESS_SECRET;

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        sub: string;
        role: string;
      };

      return {
        userId: decoded.sub,
        role: decoded.role
      };
    } catch {
      throw new BadRequestError("Invalid token");
    }
  }
};
