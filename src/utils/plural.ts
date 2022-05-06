/* 
	Adds an 's' if the number is not equal to 0
*/
export const plural = (count: number): "" | "s" => (count != 1 ? "s" : "");
