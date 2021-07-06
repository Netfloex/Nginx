import { access, constants } from "fs-extra";

const fileExist = async (file: string): Promise<boolean> => {
	return access(file, constants.F_OK)
		.then(() => true)
		.catch(() => false);
};

export default fileExist;
