import langmap from "langmap";
import latinize from "latinize";
import { traverseNode } from "@create-figma-plugin/utilities";

export function titleCase() {
  convertFunction(titleCaseFunction);
}

export function sentenceCase() {
  convertFunction(sentenceCaseFunction);
}

export function upperCase() {
  convertFunction(upperCaseFunction);
}

export function lowerCase() {
  convertFunction(lowerCaseFunction);
}

function convertFunction(caseFunction: Function) {
  figma.parameters.on(
    "input",
    ({ parameters, key, query, result }: ParameterInputEvent) => {
      const languages = getLanguages();
      result.setSuggestions(
        languages.filter((s) =>
          latinize(s.name.toLowerCase()).startsWith(
            latinize(query.toLowerCase())
          )
        )
      );
    }
  );
  figma.on("run", ({ command, parameters }: RunEvent) => {
    if (typeof parameters === "undefined") {
      throw new Error("`runEvent.parameters` is `undefined`");
    }
    convertCase(caseFunction, parameters.locale);
  });
}

async function convertCase(caseFunction: Function, locale: string) {
  var nodes = getSelectedTextNodes();
  if (nodes.length == 0) {
    figma.closePlugin(`⚠️   Please select text layers first.`);
  }
  var pending = nodes.length;
  await Promise.all(
    nodes.map((textNode: TextNode) => {
      figma.loadFontAsync(textNode.fontName as FontName).then(() => {
        textNode.characters = caseFunction(textNode.characters, locale);
        pending--;
        if (pending == 0) {
          figma.closePlugin(`✅   ${nodes.length} text nodes converted.`);
        }
      });
    })
  );
}

function getLanguages() {
  var languages = [];
  for (let lang in langmap) {
    if (lang.length <= 3) {
      languages.push({
        data: lang,
        name: langmap[lang]["nativeName"],
      });
    }
  }
  return languages.sort((a, b) => (a.name > b.name ? 1 : -1));
}

function getSelectedTextNodes(): Array<TextNode> {
  const nodes = figma.currentPage.selection;
  const result: Array<TextNode> = [];
  for (const node of nodes) {
    traverseNode(node, function (childNode: SceneNode) {
      if (childNode.type !== "TEXT") {
        return;
      }
      result.push(childNode);
    });
  }
  return result;
}

function sentenceCaseFunction(text: string, locale: string) {
  return text
    .toLocaleLowerCase(locale)
    .replace(/^\s*\w|[.?!…(...)]\s*./gu, (s) => s.toLocaleUpperCase(locale));
}

function titleCaseFunction(text: string, locale: string) {
  return text.replace(/([^\s:-])([^\s:-]*)/gu, ($0, $1, $2) => {
    return $1.toLocaleUpperCase(locale) + $2.toLocaleLowerCase(locale);
  });
}

function upperCaseFunction(text: string, locale: string) {
  return text.toLocaleUpperCase(locale);
}

function lowerCaseFunction(text: string, locale: string) {
  return text.toLocaleLowerCase(locale);
}
