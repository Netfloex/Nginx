cat dockerhub.md > tmp.md
echo -e "\n" >> tmp.md
cat README.md >> tmp.md
export URL="https:\/\/github.com\/Netfloex\/Nginx"

sed -i "s/](#/]($URL#/" tmp.md
sed -i "s/](src/]($URL\/blob\/master\/src/" tmp.md
sed -i "s/](config/]($URL\/blob\/master\/config/" tmp.md
sed -i "s/](docker/]($URL\/blob\/master\/docker/" tmp.md
sed -i "s/href=\"config/href=\"$URL\/blob\/master\/config/" tmp.md

