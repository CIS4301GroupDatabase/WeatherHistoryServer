package servlet;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.cedarsoftware.util.io.JsonWriter;
import com.ohadr.common.utils.JsonUtils;

import weatherhistory.server.Config;
import weatherhistory.server.DatabaseService;

@WebServlet(name = "WeatherServlet", urlPatterns = {"/weatherdata"})
public class WeatherServlet extends HttpServlet
{
	private static final long serialVersionUID = 1L;
	private DatabaseService database;
	
	public WeatherServlet()
	{
    	Config config;
		try 
		{
			config = new Config();
	    	DatabaseService databaseservice = new DatabaseService(config);
	    	this.database = databaseservice;
		} 
		catch (IOException e) 
		{
			e.printStackTrace();
			System.out.println("Failed to load config file");
		}

	}
	
	
	@Override
	public void init(ServletConfig config) throws ServletException 
	{
		
		super.init(config);
	}
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{
	    response.setContentType("application/json");
	    response.setCharacterEncoding("UTF-8");

		PrintWriter out = response.getWriter();
		if (request.getQueryString() != null && (request.getQueryString().contains("sql") || request.getQueryString().contains("data")))
		{
			String sqlQuery;
			boolean makePretty = false;
			if (request.getQueryString().contains("sql"))
			{
				sqlQuery = request.getParameter("sql");
				out.println("SQL Query:");
				out.println(sqlQuery);
				out.println();
				out.println("Result:");
				makePretty = true;
			}
			else
			{
				sqlQuery = request.getParameter("data");
			}
			if (!sqlQuery.isEmpty())
			{
				System.out.println("Connecting to database");
				try 
				{
					Connection connect = database.connectToDatabase();
					System.out.println("Connected to database");
					Statement query = connect.createStatement();
					System.out.println("Sending query");
					ResultSet result = query.executeQuery(sqlQuery);
					String json = JsonUtils.convertResultSetToJson(result); 
					if (makePretty)
					{
						// print a fully formated json string
						out.print(JsonWriter.formatJson(json));
					}
					else
					{
						// print the json as a single line
						out.print(json);
					}
					System.out.println("Response recieved, disconnecting from database.");
					database.disconnectFromDatabase(connect);
				} catch (SQLException e) 
				{
					System.out.println("Failed to connect to database or failed sql query");
					e.printStackTrace();
				}
				
			}
		}
		else
		{
			out.println("No query entered. The database can be queried in 2 ways.");
			out.println("To see a page with the origanal query and json with formating; query the database with: /weatherdata?sql=SELECT my FROM query");
			out.println("To get just a straight json string; query the database with: /weatherdata?data=SELECT my FROM query");
		}
	    out.flush();
		out.close();
	}
	
}
