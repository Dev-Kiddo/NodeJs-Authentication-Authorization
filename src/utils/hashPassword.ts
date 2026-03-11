import bcrypt from "bcryptjs";

export async function Hash(password: string, hash: number) {
  const hashedPassword = await bcrypt.hash(password, hash);

  return hashedPassword;
}
